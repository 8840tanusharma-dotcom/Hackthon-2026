const express = require("express");
const agentController = require("../controllers/agentController");

const router = express.Router();

// Required by spec
router.post("/init", agentController.initAgent);
router.get("/feed", agentController.getFeed);

// Demo/testing convenience — not required by spec, safe to ignore/remove.
router.post("/:agentId/publish-now", agentController.publishNow);

module.exports = router;
