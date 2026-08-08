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
  {
    name: "Google Security Blog",
    url: "https://security.googleblog.com/feeds/posts/default",
  },
  {
    name: "Microsoft Security Blog",
    url: "https://www.microsoft.com/en-us/security/blog/feed/",
  },
  {
    name: "Krebs on Security",
    url: "https://krebsonsecurity.com/feed/",
  },
];

const DOMAIN_KEYWORDS = {
  "ai security": [
    "ai security",
    "llm security",
    "ai safety",
    "cybersecurity",
    "cyber security",
    "prompt injection",
    "prompt attack",
    "jailbreak",
    "guardrail",
    "vulnerability",
    "exploit",
    "rce",
    "remote code execution",
    "data leak",
    "data exfiltration",
    "authentication",
    "authorization",
    "access control",
    "agent security",
    "ai agent security",
    "model security",
    "model poisoning",
    "supply chain",
    "privacy",
    "malware",
  ],
};

function hoursSince(date) {
  if (!date) return 999;

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return 999;

  return Math.max(
    0,
    (Date.now() - timestamp) / (1000 * 60 * 60)
  );
}

function getDomainKeywords(domain) {
  const normalizedDomain = String(domain || "")
    .toLowerCase()
    .trim();

  if (DOMAIN_KEYWORDS[normalizedDomain]) {
    return DOMAIN_KEYWORDS[normalizedDomain];
  }

  return normalizedDomain
    .split(/\s+/)
    .filter(Boolean);
}
function isDomainRelevant(item, domain) {
  const text = `${item.title || ""} ${
    item.contentSnippet || ""
  }`.toLowerCase();

  const normalizedDomain = String(domain || "")
    .toLowerCase()
    .trim();

  if (normalizedDomain === "ai security") {
    const securityKeywords = [
      "ai security",
      "llm security",
      "ai safety",
      "cybersecurity",
      "cyber security",
      "prompt injection",
      "prompt attack",
      "jailbreak",
      "guardrail",
      "vulnerability",
      "exploit",
      "rce",
      "remote code execution",
      "data leak",
      "data exfiltration",
      "authentication",
      "authorization",
      "access control",
      "agent security",
      "model security",
      "model poisoning",
      "supply chain",
      "privacy",
      "malware",
    ];

    return securityKeywords.some((keyword) =>
      text.includes(keyword)
    );
  }

  // Generic fallback for other domains.
  const domainWords = normalizedDomain
    .split(/\s+/)
    .filter(Boolean);

  return domainWords.some((word) =>
    text.includes(word)
  );
}


function calculateQuality(item, domain) {
  const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();

  const securityKeywords = [
    "security",
    "cybersecurity",
    "vulnerability",
    "vulnerabilities",
    "attack",
    "attacks",
    "threat",
    "threats",
    "privacy",
    "authentication",
    "authorization",
    "malware",
    "ransomware",
    "prompt injection",
    "jailbreak",
    "guardrail",
    "secure",
    "safety",
    "risk",
    "exploit",
    "exploits",
    "agent security",
    "ai security",
    "llm security",
  ];

  const aiKeywords = [
    "ai",
    "artificial intelligence",
    "llm",
    "agent",
    "agents",
    "machine learning",
    "generative ai",
    "model",
  ];

  let score = 0.3;

  // Source credibility
  const source = String(item.source || "").toLowerCase();
  const url = String(item.url || item.link || "").toLowerCase();

  const trustedSecuritySources = [
    "microsoft",
    "krebsonsecurity",
    "google",
    "cisco",
    "cloudflare",
    "paloalto",
    "crowdstrike",
    "mandiant",
    "sophos",
    "securityweek",
  ];

  const trustedAISources = [
    "huggingface",
    "openai",
    "anthropic",
    "google",
    "microsoft",
    "nvidia",
  ];

  if (
    trustedSecuritySources.some(
      (name) => source.includes(name) || url.includes(name)
    )
  ) {
    score += 0.25;
  } else if (
    trustedAISources.some(
      (name) => source.includes(name) || url.includes(name)
    )
  ) {
    score += 0.2;
  }

  // Security relevance
  const securityMatches = securityKeywords.filter((keyword) =>
    text.includes(keyword)
  ).length;

  score += Math.min(0.2, securityMatches * 0.04);

  // AI relevance
  const aiMatches = aiKeywords.filter((keyword) =>
    text.includes(keyword)
  ).length;

  score += Math.min(0.1, aiMatches * 0.03);

  // Useful article summary
  if ((item.contentSnippet || "").length > 100) {
    score += 0.05;
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
  source: feed.name,
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
 */
async function fetchLiveTopics(persona, { limit = 4 } = {}) {
  logger.info(
    `[topicDiscovery] discovering live topics for domain="${persona.domain}"`
  );

  const results = await Promise.all(RSS_FEEDS.map(fetchFeed));

  const allItems = results.flat();

  // Remove items without usable titles or links.
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
        summary: String(item.summary)
          .replace(/\s+/g, " ")
          .trim(),
        url: item.url,
        quality: calculateQuality(item, persona.domain),
        freshnessHours: Number(freshnessHours.toFixed(2)),
      };
    })
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

module.exports = {
  fetchLiveTopics,
};