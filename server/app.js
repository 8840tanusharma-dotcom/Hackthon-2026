const agentRoutes = require("./routes/agentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");



const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "autonomous-ai-creator-backend" });
});

app.use("/api/agent", agentRoutes);
app.use("/api/chat", chatRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
