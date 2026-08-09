const express = require("express");
const chatController = require("../controllers/chatController");

const router = express.Router();

// Send message
router.post("/", chatController.chat);

// Get saved chat history
router.get("/history/:agentId", chatController.history);

module.exports = router;