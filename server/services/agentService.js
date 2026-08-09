const breethMemoryService = require("./breethMemoryService");
const Agent = require("../models/Agent");
const Post = require("../models/Post");
const memoryService = require("./memoryService");
const topicDiscoveryService = require("./topicDiscoveryService");
const editorialService = require("./editorialService");
const contentGenerationService = require("./contentGenerationService");
const config = require("../config/config");
const logger = require("../utils/logger");

/**
 * Agent Service
 * ------------------------------------------------------------------
 * Orchestrates the full autonomous pipeline:
 *   discover -> judge/reject -> generate -> remember/publish
 *
 * This is the single place that stitches the other services together,
 * so the controller layer stays thin and the pipeline stays easy to
 * explain step-by-step in a live demo.
 */

function initAgent({ persona }) {
  const agent = new Agent({ persona });
  memoryService.createAgent(agent);
  return agent;
}

function getFeed(agentId) {
  const agent = memoryService.getAgent(agentId);
  if (!agent) return null;
  return memoryService.getPosts(agentId).map((p) => p.toPublicJSON());
}

/**
 * Runs a single autonomous publishing cycle for one agent:
 *  1. Discover candidate topics from "live sources".
 *  2. Apply editorial judgment (reject duplicates / low-value topics).
 *  3. If something survives, generate a post and remember/publish it.
 *  4. If nothing survives, skip this cycle — that IS editorial judgment.
 *
 * Returns the published Post, or null if the cycle produced no post.
 */
async function runPublishingCycle(agentId) {
  const agent = memoryService.getAgent(agentId);
  if (!agent || agent.status !== "active") return null;

  const candidateTopics = await topicDiscoveryService.fetchLiveTopics(
  agent.persona
);

const publishedKeys = memoryService.getPublishedTopicKeys(agentId);

// Check Breeth memory before editorial selection.
const memoryAwareTopics = [];

for (const topic of candidateTopics) {
  const remembered = await breethMemoryService.hasRelatedMemory(
    agentId,
    topic.title
  );

  if (remembered) {
    logger.info(
      `[agentService] agent ${agentId}: Breeth memory found previous coverage for "${topic.title}"`
    );
    continue;
  }


  memoryAwareTopics.push(topic);
}


const chosen = editorialService.selectTopic(
  memoryAwareTopics,
  agent.persona,
  publishedKeys
);
  if (!chosen) {
    logger.info(`[agentService] agent ${agentId}: no topic cleared editorial bar this cycle`);
    return null;
  }

  const generated = await contentGenerationService.generatePost(agent.persona, chosen);

  const post = new Post({
    agentId,
    text: generated.text,
    rationale: generated.rationale,
    sources: generated.sources,
    topic: chosen.title,
  });

 memoryService.rememberPost(agentId, post, chosen.key);

await breethMemoryService.rememberPost(
  agent,
  post,
  chosen.title
);

return post;
}

module.exports = { initAgent, getFeed, runPublishingCycle };
