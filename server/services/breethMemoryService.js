const axios = require("axios");
const logger = require("../utils/logger");

const BREETH_URL = "https://api.thebreeth.com/v1";
const BREETH_TIMEOUT = 15000;

function getHeaders() {
  if (!process.env.BREETH_API_KEY) {
    throw new Error("BREETH_API_KEY is not configured");
  }

  return {
    Authorization: `Bearer ${process.env.BREETH_API_KEY}`,
    "Content-Type": "application/json",
  };
}

function getGroupId(agentId) {
  return `autonomous-agent-${agentId}`;
}

async function rememberPost(agent, post, topic) {
  const groupId = getGroupId(agent.id);

  const content = [
    `Agent: ${agent.persona.name}`,
    `Domain: ${agent.persona.domain}`,
    `Published topic: ${topic}`,
    `Post: ${post.text}`,
    `Rationale: ${post.rationale}`,
    `Sources: ${(post.sources || []).join(", ")}`,
  ].join("\n");

  try {
    const response = await axios.post(
      `${BREETH_URL}/episodes`,
      {
        content,
        group_id: groupId,
        extract_intent: true,
      },
      {
        headers: getHeaders(),
        timeout: BREETH_TIMEOUT,
      }
    );

    logger.info(
      `[breeth] remembered post ${post.id} for agent ${agent.id}`
    );

    return response.data;
  } catch (error) {
    logger.warn(
      `[breeth] failed to remember post: ${
        error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message
      }`
    );

    // Breeth failure must never stop local publishing.
    return null;
  }
}

async function searchMemory(agentId, query, limit = 5) {
  const groupId = getGroupId(agentId);

  try {
    const response = await axios.post(
      `${BREETH_URL}/search`,
      {
        query,
        group_id: groupId,
        limit,
      },
      {
        headers: getHeaders(),
        timeout: BREETH_TIMEOUT,
      }
    );

    return response.data;
  } catch (error) {
    logger.warn(
      `[breeth] memory search failed: ${
        error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message
      }`
    );

    return null;
  }
}

module.exports = {
  rememberPost,
  searchMemory,
  getGroupId,
};