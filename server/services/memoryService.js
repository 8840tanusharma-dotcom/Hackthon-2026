const store = require("../data/store");
const config = require("../config/config");
const logger = require("../utils/logger");

/**
 * Memory Service
 * ------------------------------------------------------------------
 * This is the ONLY module that other services/controllers talk to for
 * persistence. It currently delegates to the local in-memory store
 * (server/data/store.js), but every method here is written against an
 * interface that a Breeth-backed implementation could satisfy instead:
 *
 *   - createAgent(agent)
 *   - getAgent(agentId)
 *   - rememberPost(agentId, post)
 *   - getPosts(agentId)
 *   - getPublishedTopicKeys(agentId)
 *
 * TO INTEGRATE BREETH LATER:
 *   1. Implement a `breethMemoryService.js` with the same method names.
 *   2. Switch on `config.memoryProvider` below (or in a small factory)
 *      to export the Breeth-backed version instead of the local one.
 *   3. No controller/service code outside this file needs to change,
 *      since everything already goes through this interface.
 */

function createAgent(agent) {
  store.agents.set(agent.id, agent);
  store.postsByAgent.set(agent.id, []);
  logger.info(`[memory] created agent ${agent.id} (${agent.persona.name})`);
  return agent;
}

function getAgent(agentId) {
  return store.agents.get(agentId) || null;
}

function getAllAgents() {
  return Array.from(store.agents.values());
}

function getPosts(agentId) {
  return store.postsByAgent.get(agentId) || [];
}

function getPublishedTopicKeys(agentId) {
  const agent = getAgent(agentId);
  return agent ? agent.publishedTopicKeys : [];
}

/**
 * Persists a new post for an agent and records its topic key so future
 * editorial passes know not to republish it. Trims history to the
 * configured max so memory doesn't grow unbounded in a long-running demo.
 */
function rememberPost(agentId, post, topicKey) {
  const agent = getAgent(agentId);
  if (!agent) {
    throw new Error(`Cannot remember post: unknown agentId ${agentId}`);
  }

  const posts = getPosts(agentId);
  posts.unshift(post); // newest first
  if (posts.length > config.maxPostsPerAgent) {
    posts.length = config.maxPostsPerAgent;
  }
  store.postsByAgent.set(agentId, posts);

  if (topicKey) {
    agent.publishedTopicKeys.push(topicKey);
  }

  logger.info(`[memory] agent ${agentId} published post ${post.id}`);
  return post;
}

module.exports = {
  createAgent,
  getAgent,
  getAllAgents,
  getPosts,
  getPublishedTopicKeys,
  rememberPost,
};
