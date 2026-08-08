const Parser = require("rss-parser");
const logger = require("../utils/logger");

const parser = new Parser({
  timeout: 10000,
});

const RSS_FEEDS = [
  {
    name: "Google AI Blog",
    url: "https://blog.google/technology/ai/rss/",
  },
  {
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog/feed.xml",
  },
  {
    name: "MIT Technology Review AI",
    url: "https://www.technologyreview.com/topic/artificial-intelligence/feed/",
  },
];

function hoursSince(date) {
  if (!date) return 999;

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return 999;

  return Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60));
}

function calculateQuality(item, domain) {
  const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();
  const domainWords = String(domain || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  let score = 0.5;

  // Prefer topics related to the configured persona domain.
  if (domainWords.some((word) => text.includes(word))) {
    score += 0.25;
  }

  // Prefer items with useful descriptions.
  if ((item.contentSnippet || "").length > 100) {
    score += 0.1;
  }

  // Prefer recent content.
  const freshness = hoursSince(item.isoDate || item.pubDate);

  if (freshness <= 24) {
    score += 0.1;
  }

  return Math.min(1, Number(score.toFixed(3)));
}

async function fetchFeed(feed) {
  try {
    logger.debug(`[topicDiscovery] fetching ${feed.name}`);

    const result = await parser.parseURL(feed.url);

    return (result.items || []).map((item) => ({
      title: item.title,
      summary:
        item.contentSnippet ||
        item.content ||
        item.summary ||
        "No summary available.",
      url: item.link,
      publishedAt: item.isoDate || item.pubDate,
    }));
  } catch (error) {
    logger.warn(
      `[topicDiscovery] failed to fetch ${feed.name}: ${error.message}`
    );

    return [];
  }
}

/**
 * Discover candidate topics from live RSS sources.
 *
 * Return shape intentionally remains compatible with the existing
 * editorial -> generation -> memory -> publishing pipeline.
 */
async function fetchLiveTopics(persona, { limit = 4 } = {}) {
  logger.info(
    `[topicDiscovery] discovering live topics for domain="${persona.domain}"`
  );

  const results = await Promise.all(RSS_FEEDS.map(fetchFeed));

  const allItems = results.flat();

  // Remove items without usable titles/links.
  const validItems = allItems.filter(
    (item) => item.title && item.url
  );

  // Remove duplicate URLs.
  const uniqueItems = Array.from(
    new Map(validItems.map((item) => [item.url, item])).values()
  );

  const topics = uniqueItems
    .map((item) => {
      const freshnessHours = hoursSince(item.publishedAt);

      return {
        title: item.title.trim(),
        summary: String(item.summary).replace(/\s+/g, " ").trim(),
        url: item.url,
        quality: calculateQuality(item, persona.domain),
        freshnessHours: Number(freshnessHours.toFixed(2)),
      };
    })
    // Prefer recent content.
    .filter((topic) => topic.freshnessHours <= 72)
    .sort((a, b) => {
      const qualityDifference = b.quality - a.quality;

      if (qualityDifference !== 0) {
        return qualityDifference;
      }

      return a.freshnessHours - b.freshnessHours;
    });

  logger.info(
    `[topicDiscovery] discovered ${topics.length} live candidate topics`
  );

  return topics.slice(0, limit);
}

module.exports = { fetchLiveTopics };