const store = require("../data/store");
const config = require("../config/config");
const logger = require("../utils/logger");

function createAgent(agent) {
  store.agents.set(agent.id, agent);
  store.postsByAgent.set(agent.id, []);
  store.chatsByAgent.set(agent.id, []);

  store.persist();

  logger.info(
    `[memory] created agent ${agent.id} (${agent.persona.name})`
  );

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

function rememberPost(agentId, post, topicKey) {
  const agent = getAgent(agentId);

  if (!agent) {
    throw new Error(`Cannot remember post: unknown agentId ${agentId}`);
  }

  const posts = getPosts(agentId);

  posts.unshift(post);

  if (posts.length > config.maxPostsPerAgent) {
    posts.length = config.maxPostsPerAgent;
  }

  store.postsByAgent.set(agentId, posts);

  if (topicKey) {
    agent.publishedTopicKeys.push(topicKey);
  }

  store.persist();

  logger.info(
    `[memory] agent ${agentId} published post ${post.id}`
  );

  return post;
}

/* =========================
   CHAT MEMORY
========================= */

function saveChatMessage(agentId, message) {
  const agent = getAgent(agentId);

  if (!agent) {
    throw new Error(`Cannot save chat: unknown agentId ${agentId}`);
  }

  if (!store.chatsByAgent.has(agentId)) {
    store.chatsByAgent.set(agentId, []);
  }

  const history = store.chatsByAgent.get(agentId);

  const chatMessage = {
    role: message.role,
    text: message.text,
    timestamp: new Date().toISOString(),
  };

  history.push(chatMessage);

  const maxChatMessages = 100;

  if (history.length > maxChatMessages) {
    history.splice(0, history.length - maxChatMessages);
  }

  store.chatsByAgent.set(agentId, history);

  store.persist();

  logger.info(
    `[memory] saved ${message.role} message for agent ${agentId}`
  );

  return chatMessage;
}

function getChatHistory(agentId) {
  return store.chatsByAgent.get(agentId) || [];
}

function clearChatHistory(agentId) {
  if (!getAgent(agentId)) {
    return false;
  }

  store.chatsByAgent.set(agentId, []);

  store.persist();

  logger.info(
    `[memory] cleared chat history for agent ${agentId}`
  );

  return true;
}

module.exports = {
  createAgent,
  getAgent,
  getAllAgents,
  getPosts,
  getPublishedTopicKeys,
  rememberPost,

  saveChatMessage,
  getChatHistory,
  clearChatHistory,
};