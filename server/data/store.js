const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname);
const DATA_FILE = path.join(DATA_DIR, "store.json");

const agents = new Map();
const postsByAgent = new Map();
const chatsByAgent = new Map();

function save() {
  const data = {
    agents: Array.from(agents.entries()).map(([id, agent]) => ({
      id,
      ...agent,
    })),

    postsByAgent: Array.from(postsByAgent.entries()),

    chatsByAgent: Array.from(chatsByAgent.entries()),
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

    agents.clear();
    postsByAgent.clear();
    chatsByAgent.clear();

    for (const agent of data.agents || []) {
      const { id, ...agentData } = agent;

      agents.set(id, {
        id,
        ...agentData,
      });
    }

    for (const [agentId, posts] of data.postsByAgent || []) {
      postsByAgent.set(agentId, posts || []);
    }

    for (const [agentId, chats] of data.chatsByAgent || []) {
      chatsByAgent.set(agentId, chats || []);
    }

    console.log(
      `[store] Loaded ${agents.size} agent(s) from persistent storage`
    );
  } catch (error) {
    console.error("[store] Failed to load persistent data:", error.message);
  }
}

function persist() {
  save();
}

function reset() {
  agents.clear();
  postsByAgent.clear();
  chatsByAgent.clear();

  if (fs.existsSync(DATA_FILE)) {
    fs.unlinkSync(DATA_FILE);
  }
}

load();

module.exports = {
  agents,
  postsByAgent,
  chatsByAgent,
  persist,
  reset,
};