const agentService = require("../services/agentService");
const publishScheduler = require("../scheduler/publishScheduler");
const logger = require("../utils/logger");

/**
 * POST /api/agent/init
 * Body: { persona: { name, domain } }
 * Response: { agentId }
 */
function initAgent(req, res) {
  try {
    const { persona } = req.body || {};

    if (!persona || !persona.name || !persona.domain) {
      return res.status(400).json({
        error: "persona.name and persona.domain are required",
      });
    }

    const agent = agentService.initAgent({ persona });
    return res.status(201).json({ agentId: agent.id });
  } catch (err) {
    logger.error("[agentController.initAgent]", err.message);
    return res.status(500).json({ error: "Failed to initialize agent" });
  }
}

/**
 * GET /api/agent/feed?agentId=...
 * Response: { posts: [...] }
 */
function getFeed(req, res) {
  try {
    const { agentId } = req.query;

    if (!agentId) {
      return res.status(400).json({ error: "agentId query parameter is required" });
    }

    const posts = agentService.getFeed(agentId);

    if (posts === null) {
      return res.status(404).json({ error: `No agent found with id ${agentId}` });
    }

    return res.status(200).json({ posts });
  } catch (err) {
    logger.error("[agentController.getFeed]", err.message);
    return res.status(500).json({ error: "Failed to fetch feed" });
  }
}

/**
 * POST /api/agent/:agentId/publish-now
 * Convenience/demo endpoint (not in the original spec) to trigger one
 * publishing cycle immediately instead of waiting for the scheduler
 * interval — useful for live demos and testing.
 */
async function publishNow(req, res) {
  try {
    const { agentId } = req.params;
    const post = await publishScheduler.triggerNow(agentId);

    if (!post) {
      return res.status(200).json({
        published: false,
        message: "No topic cleared editorial judgment this cycle.",
      });
    }

    return res.status(201).json({ published: true, post: post.toPublicJSON() });
  } catch (err) {
    logger.error("[agentController.publishNow]", err.message);
    return res.status(500).json({ error: "Failed to run publishing cycle" });
  }
}

module.exports = { initAgent, getFeed, publishNow };
