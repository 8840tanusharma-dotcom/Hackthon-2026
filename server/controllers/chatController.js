const chatService = require("../services/chatService");
const memoryService = require("../services/memoryService");
const logger = require("../utils/logger");

async function chat(req, res) {
  try {
    const { agentId, persona, message } = req.body || {};

    if (!agentId) {
      return res.status(400).json({
        error: "agentId is required",
      });
    }

    if (!persona || !persona.name || !persona.domain) {
      return res.status(400).json({
        error: "persona.name and persona.domain are required",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "message is required",
      });
    }

    let agent = memoryService.getAgent(agentId);

if (!agent) {
  agent = memoryService.createAgent({
    id: agentId,
    persona: {
      name: persona.name,
      domain: persona.domain,
    },
    publishedTopicKeys: [],
  });
}

    const userText = message.trim();

    // Save user message
    memoryService.saveChatMessage(agentId, {
      role: "user",
      text: userText,
    });

    // Get previous conversation
    const history = memoryService.getChatHistory(agentId);

    // Ask Gemini
    const result = await chatService.chat({
      persona,
      message: userText,
      memories: history.map(
        (item) => `${item.role}: ${item.text}`
      ),
    });

    // Save AI response
    memoryService.saveChatMessage(agentId, {
      role: "assistant",
      text: result.text,
    });

    return res.status(200).json(result);
  } catch (err) {
    logger.error("[chatController.chat]", err.message);

    return res.status(500).json({
      error: "Failed to generate AI response",
    });
  }
}


// Get saved chat history
async function history(req, res) {
  try {
    const { agentId } = req.params;

    const agent = memoryService.getAgent(agentId);

    if (!agent) {
      return res.status(404).json({
        error: "Agent not found",
      });
    }

    const messages = memoryService.getChatHistory(agentId);

    return res.status(200).json({
      messages,
    });
  } catch (err) {
    logger.error("[chatController.history]", err.message);

    return res.status(500).json({
      error: "Failed to load chat history",
    });
  }
}


module.exports = {
  chat,
  history,
};