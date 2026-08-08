const logger = require("../utils/logger");

/**
 * Content Generation Service
 * ------------------------------------------------------------------
 * Turns a selected topic into a published post: body text + rationale.
 *
 * MOCKED FOR NOW via templating so the pipeline is fully runnable
 * without an API key. To wire in a real model, replace the body of
 * `generatePost()` with a call to the Anthropic Messages API using
 * `persona` + `topic` as the prompt context, and keep the same return
 * shape: { text, rationale, sources }.
 */

function buildText(persona, topic) {
  return (
    `${persona.name} on ${persona.domain}: ${topic.title}. ` +
    `${topic.summary} This matters for anyone building or defending AI systems ` +
    `right now — worth tracking as it develops.`
  );
}

function buildRationale(persona, topic, editorialScore) {
  return (
    `Selected because it is directly relevant to ${persona.domain} ` +
    `(editorial score ${editorialScore}/1), is recent (${topic.freshnessHours}h old), ` +
    `and offers concrete signal rather than speculation — consistent with ` +
    `${persona.name}'s standing editorial bar.`
  );
}

async function generatePost(persona, evaluatedTopic) {
  logger.debug(`[contentGeneration] generating post for topic="${evaluatedTopic.title}"`);

  // Simulate model latency.
  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    text: buildText(persona, evaluatedTopic),
    rationale: buildRationale(persona, evaluatedTopic, evaluatedTopic.score),
    sources: [evaluatedTopic.url],
  };
}

module.exports = { generatePost };
