/**
 * In-memory data store.
 *
 * This is intentionally the ONLY place that holds raw Maps of data.
 * Everything else (services, controllers) goes through memoryService,
 * which wraps this store. That indirection is what lets us swap this
 * file out for a Breeth-backed implementation later without touching
 * any business logic - see server/services/memoryService.js.
 */

const agents = new Map(); // agentId -> Agent
const postsByAgent = new Map(); // agentId -> Post[] (newest first)

module.exports = {
  agents,
  postsByAgent,

  reset() {
    agents.clear();
    postsByAgent.clear();
  },
};
