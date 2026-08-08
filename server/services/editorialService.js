const config = require("../config/config");
const logger = require("../utils/logger");

/**
 * Editorial Service
 * ------------------------------------------------------------------
 * Applies "editorial judgment" to a list of candidate topics:
 *   1. Rejects topics already covered (memory of past posts).
 *   2. Rejects topics that are stale/low-quality/off-domain.
 *   3. Scores the remainder and picks the single best one.
 *
 * This is where a real system would eventually plug in an LLM call
 * ("does this topic deserve a post, and why?") — the mocked scoring
 * heuristic below is a stand-in with the exact same interface, so
 * swapping it for an LLM-backed judgment call later is a one-file change.
 */

function normalizeKey(title) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Very small heuristic "editorial score" in [0, 1]:
 *  - source quality (as reported by discovery)
 *  - freshness (recent = better)
 *  - domain relevance (naive keyword overlap with persona.domain)
 */
function scoreTopic(topic, persona) {
  const freshnessScore = Math.max(0, 1 - topic.freshnessHours / 24); // fresher = higher
  const domainWords = persona.domain.toLowerCase().split(/\s+/);
  const haystack = `${topic.title} ${topic.summary}`.toLowerCase();
  const relevanceHits = domainWords.filter((w) => haystack.includes(w)).length;
  const relevanceScore = Math.min(1, relevanceHits / domainWords.length);

  const score =
    topic.quality * 0.5 + freshnessScore * 0.2 + relevanceScore * 0.3;

  return Number(score.toFixed(3));
}

/**
 * Filters + ranks candidate topics, returning the best one to publish,
 * or null if nothing clears the bar (i.e. everything is rejected).
 *
 * @param {Array} candidateTopics - output of topicDiscoveryService
 * @param {Object} persona
 * @param {string[]} publishedTopicKeys - normalized titles already published
 */
function selectTopic(candidateTopics, persona, publishedTopicKeys = []) {
  const alreadyPublished = new Set(publishedTopicKeys);

  const evaluated = candidateTopics
    .map((topic) => ({
      ...topic,
      key: normalizeKey(topic.title),
      score: scoreTopic(topic, persona),
    }))
    .filter((topic) => {
      if (alreadyPublished.has(topic.key)) {
        logger.debug(`[editorial] rejecting duplicate topic: "${topic.title}"`);
        return false;
      }
      if (topic.score < config.editorialThreshold) {
        logger.debug(
          `[editorial] rejecting low-value topic (score=${topic.score}): "${topic.title}"`
        );
        return false;
      }
      return true;
    })
    .sort((a, b) => b.score - a.score);

  if (evaluated.length === 0) {
    return null;
  }

  return evaluated[0];
}

module.exports = { selectTopic, scoreTopic, normalizeKey };
