const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  checkInToEvent
} = require("../controllers/event.controller");

// Public routes
router.get("/", getEvents);
router.get("/:id", getEvent);

// Protected routes (user actions)
router.post("/:id/register", protect, registerForEvent);
router.post("/:id/checkin", protect, checkInToEvent);

// Protected routes (admin only)
router.post("/", protect, authorize("admin"), createEvent);
router.put("/:id", protect, authorize("admin"), updateEvent);
router.delete("/:id", protect, authorize("admin"), deleteEvent);

module.exports = router;