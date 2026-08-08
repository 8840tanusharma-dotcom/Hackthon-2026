const config = require("../config/config");
const memoryService = require("../services/memoryService");
const agentService = require("../services/agentService");
const logger = require("../utils/logger");

/**
 * Publish Scheduler
 * ------------------------------------------------------------------
 * Gives agents the "publish autonomously over time" behaviour required
 * by the spec. On a fixed interval it wakes up, iterates every active
 * agent, and asks agentService to run one publishing cycle for each.
 *
 * Kept deliberately simple (single setInterval) rather than a queue/
 * cron microservice — easy to explain live, easy to swap for
 * node-cron or a real job queue later without touching the pipeline.
 */

let intervalHandle = null;

async function tick() {
  const agents = memoryService.getAllAgents();
  for (const agent of agents) {
    try {
      const post = await agentService.runPublishingCycle(agent.id);
      if (post) {
        logger.info(`[scheduler] agent ${agent.id} published "${post.id}"`);
      }
    } catch (err) {
      logger.error(`[scheduler] cycle failed for agent ${agent.id}:`, err.message);
    }
  }
}

function start() {
  if (intervalHandle) return; // already running
  logger.info(`[scheduler] starting publish loop every ${config.publishIntervalMs}ms`);
  intervalHandle = setInterval(tick, config.publishIntervalMs);
}

function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

/** Exposed for tests / manual "publish now" triggers via the API layer. */
async function triggerNow(agentId) {
  return agentService.runPublishingCycle(agentId);
}

module.exports = { start, stop, triggerNow };
