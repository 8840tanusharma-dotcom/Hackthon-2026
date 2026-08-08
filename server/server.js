const app = require("./app");
const config = require("./config/config");
const publishScheduler = require("./scheduler/publishScheduler");
const logger = require("./utils/logger");

app.listen(config.port, () => {
  logger.info(`Server listening on http://localhost:${config.port}`);
  // Start the autonomous publishing loop for all active agents.
  publishScheduler.start();
});
