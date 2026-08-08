const { generateId } = require("../utils/idGenerator");

/**
 * Agent represents one autonomous persona-driven creator.
 *
 * persona.name   - display name of the agent (e.g. "Ada")
 * persona.domain - the subject area it stays consistent in (e.g. "AI Security")
 */
class Agent {
  constructor({ persona }) {
    if (!persona || !persona.name || !persona.domain) {
      throw new Error("Agent requires a persona with { name, domain }");
    }

    this.id = generateId();
    this.persona = {
      name: persona.name,
      domain: persona.domain,
      // A short standing voice/tone description derived from the domain.
      // Keeps every generated post "sounding like" the same author.
      voice: `Expert, curious, and pragmatic voice focused on ${persona.domain}.`,
    };
    this.createdAt = new Date().toISOString();
    this.status = "active"; // active | paused
    // Topics already covered, used by editorial judgment to avoid repeats.
    this.publishedTopicKeys = [];
  }
}

module.exports = Agent;
