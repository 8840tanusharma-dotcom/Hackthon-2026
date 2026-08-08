const config = require("../config/config");
const logger = require("../utils/logger");

function normalizeKey(title) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Calculate how relevant a topic is to the agent's persona.
 */
function calculateRelevance(topic, persona) {
  const domainWords = persona.domain
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const haystack = `${topic.title} ${topic.summary || ""}`.toLowerCase();

  const relevanceHits = domainWords.filter((word) =>
    haystack.includes(word)
  ).length;

  if (domainWords.length === 0) {
    return 0;
  }

  return Number(
    Math.min(1, relevanceHits / domainWords.length).toFixed(3)
  );
}

/**
 * Editorial score in [0, 1].
 *
 * Factors:
 * - source quality: 50%
 * - freshness: 20%
 * - persona relevance: 30%
 */
function scoreTopic(topic, persona) {
  const freshnessScore = Math.max(
    0,
    1 - topic.freshnessHours / 24
  );

  const relevanceScore = calculateRelevance(topic, persona);

  const score =
    topic.quality * 0.5 +
    freshnessScore * 0.2 +
    relevanceScore * 0.3;

  return Number(score.toFixed(3));
}

/**
 * Evaluate every topic and explain the decision.
 */
function evaluateTopic(topic, persona, publishedTopicKeys = []) {
  const key = normalizeKey(topic.title);
  const score = scoreTopic(topic, persona);

  if (publishedTopicKeys.includes(key)) {
    return {
      ...topic,
      key,
      score,
      decision: "rejected",
      reason: "Duplicate topic already published",
    };
  }

  if (topic.freshnessHours > 72) {
    return {
      ...topic,
      key,
      score,
      decision: "rejected",
      reason: "Topic is too old",
    };
  }

  if (topic.quality < 0.4) {
    return {
      ...topic,
      key,
      score,
      decision: "rejected",
      reason: "Source quality is too low",
    };
  }

  if (score < config.editorialThreshold) {
    return {
      ...topic,
      key,
      score,
      decision: "rejected",
      reason: `Editorial score ${score} is below threshold ${config.editorialThreshold}`,
    };
  }

  return {
    ...topic,
    key,
    score,
    decision: "selected",
    reason: `Strong relevance, quality, and freshness for ${persona.domain}`,
  };
}

/**
 * Evaluate, filter and rank topics.
 */
function selectTopic(
  candidateTopics,
  persona,
  publishedTopicKeys = []
) {
  const evaluated = candidateTopics.map((topic) =>
    evaluateTopic(topic, persona, publishedTopicKeys)
  );

  evaluated.forEach((topic) => {
    if (topic.decision === "rejected") {
      logger.debug(
        `[editorial] REJECTED "${topic.title}" — ${topic.reason}`
      );
    } else {
      logger.debug(
        `[editorial] SELECTED "${topic.title}" — ${topic.reason}`
      );
    }
  });

  const selected = evaluated
    .filter((topic) => topic.decision === "selected")
    .sort((a, b) => b.score - a.score);

  if (selected.length === 0) {
    logger.info(
      "[editorial] No topic cleared the editorial bar this cycle"
    );

    return null;
  }

  return selected[0];
}

module.exports = {
  selectTopic,
  scoreTopic,
  normalizeKey,
  evaluateTopic,
};