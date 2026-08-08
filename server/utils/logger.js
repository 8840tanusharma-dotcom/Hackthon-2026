/**
 * Minimal timestamped logger. Swappable for pino/winston later without
 * touching call sites.
 */
function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info: (...args) => console.log(`[INFO ${timestamp()}]`, ...args),
  warn: (...args) => console.warn(`[WARN ${timestamp()}]`, ...args),
  error: (...args) => console.error(`[ERROR ${timestamp()}]`, ...args),
  debug: (...args) => {
    if (process.env.DEBUG) console.debug(`[DEBUG ${timestamp()}]`, ...args);
  },
};

module.exports = logger;
