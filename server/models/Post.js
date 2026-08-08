const { generateId } = require("../utils/idGenerator");

/**
 * Post represents a single autonomously published piece of content.
 * Every post is required to carry a rationale + sources, matching the
 * "editorial transparency" requirement of the problem statement.
 */
class Post {
  constructor({ agentId, text, rationale, sources, topic }) {
    if (!text || !rationale || !Array.isArray(sources)) {
      throw new Error("Post requires text, rationale, and sources[]");
    }

    this.id = generateId();
    this.agentId = agentId;
    this.createdAt = new Date().toISOString();
    this.text = text;
    this.rationale = rationale;
    this.sources = sources;
    // Internal-only field (not required by the API contract) kept for
    // debugging / future analytics - which topic this post came from.
    this.topic = topic || null;
  }

  /** Shape returned to API consumers (matches the spec exactly). */
  toPublicJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      text: this.text,
      rationale: this.rationale,
      sources: this.sources,
    };
  }
}

module.exports = Post;
