/**
 * Central configuration.
 * Kept in one place so the live-coding demo can tweak behaviour
 * (publish interval, editorial threshold, etc.) without hunting
 * through the codebase.
 */
module.exports = {
  port: process.env.PORT || 4000,

  // How often (ms) the scheduler wakes each active agent up to
  // consider publishing. Short by default so it's demoable live.
  publishIntervalMs: Number(process.env.PUBLISH_INTERVAL_MS) || 60 * 1000, // 1 min

  // Editorial judgment: minimum score (0-1) a topic must clear to be
  // considered "worth publishing". Anything below this is rejected.
  editorialThreshold: Number(process.env.EDITORIAL_THRESHOLD) || 0.55,

  // Max posts kept in memory per agent (feed history).
  maxPostsPerAgent: 200,

  // Memory layer mode: "local" uses the in-process store, "breeth" is a
  // placeholder for wiring up Breeth as an external memory service later.
  memoryProvider: process.env.MEMORY_PROVIDER || "local",
};
