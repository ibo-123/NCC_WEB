const Achievement = require("../models/Achievement.model");
const User = require("../models/User.model");
const AuditLog = require("../models/AuditLog.model");
const asyncHandler = require("../middleware/catchMiddleware");

// GET /api/achievements
exports.getAchievements = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.isTeamAchievement !== undefined) {
    filter.isTeamAchievement = req.query.isTeamAchievement === "true";
  }
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } }
    ];
  }

  if (!req.user || (req.user.role !== "admin" && req.user.role !== "president" && req.user.role !== "vice-president")) {
    filter.isActive = true;
  }

  const sort = req.query.sortBy === "date" ? { assignedDate: -1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Achievement.find(filter)
      .populate("assignedBy", "name")
      .populate("assignedTo", "name studentId department profileImage")
      .skip(skip)
      .limit(limit)
      .sort(sort),
    Achievement.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// GET /api/achievements/:id
exports.getAchievement = asyncHandler(async (req, res) => {
  const ach = await Achievement.findById(req.params.id)
    .populate("assignedBy", "name")
    .populate("assignedTo", "name studentId department profileImage");

  if (!ach) return res.status(404).json({ success: false, message: "Achievement not found" });

  if (!ach.isActive && (!req.user || (req.user.role !== "admin" && req.user.role !== "president" && req.user.role !== "vice-president"))) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // non-blocking view increment
  Achievement.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).catch(() => {});

  res.status(200).json({ success: true, data: ach });
});

// POST /api/achievements
exports.createAchievement = asyncHandler(async (req, res) => {
  const { title, description, category, points, date, assignedTo, isTeamAchievement, links } = req.body;

  if (!req.user || (req.user.role !== "admin" && req.user.role !== "president" && req.user.role !== "vice-president")) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  if (assignedTo && assignedTo.length) {
    const users = await User.find({ _id: { $in: assignedTo } });
    if (users.length !== assignedTo.length) return res.status(400).json({ success: false, message: "Some users not found" });
  }

  const created = await Achievement.create({
    title,
    description,
    category,
    points: points || 0,
    date: date || new Date(),
    assignedTo: assignedTo || [],
    isTeamAchievement: !!isTeamAchievement,
    links: links || [],
    assignedBy: req.user._id,
    isActive: true
  });

  AuditLog.create({ action: "CREATE_ACHIEVEMENT", performedBy: req.user._id, details: `Created ${title}`, ipAddress: req.ip }).catch(() => {});

  res.status(201).json({ success: true, data: created });
});

// PUT /api/achievements/:id
exports.updateAchievement = asyncHandler(async (req, res) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "president" && req.user.role !== "vice-president")) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const allowed = ["title", "description", "category", "points", "date", "assignedTo", "isTeamAchievement", "links", "isActive"];
  const update = {};
  for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

  const updated = await Achievement.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    .populate("assignedBy", "name")
    .populate("assignedTo", "name studentId department profileImage");

  if (!updated) return res.status(404).json({ success: false, message: "Achievement not found" });

  AuditLog.create({ action: "UPDATE_ACHIEVEMENT", performedBy: req.user._id, details: `Updated ${updated.title}`, ipAddress: req.ip }).catch(() => {});

  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/achievements/:id
exports.deleteAchievement = asyncHandler(async (req, res) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "president" && req.user.role !== "vice-president")) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const removed = await Achievement.findByIdAndDelete(req.params.id);
  if (!removed) return res.status(404).json({ success: false, message: "Achievement not found" });

  AuditLog.create({ action: "DELETE_ACHIEVEMENT", performedBy: req.user._id, details: `Deleted ${removed.title}`, ipAddress: req.ip }).catch(() => {});

  res.status(200).json({ success: true, message: "Deleted" });
});

// GET /api/achievements/user/:userId
exports.getUserAchievements = asyncHandler(async (req, res) => {
  const target = req.params.userId || (req.user && req.user._id);
  if (!target) return res.status(400).json({ success: false, message: "User id required" });

  if (req.user && req.user._id.toString() !== target.toString() && req.user.role !== "admin" && req.user.role !== "president" && req.user.role !== "vice-president") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const items = await Achievement.find({ assignedTo: target, isActive: true }).populate("assignedBy", "name").sort({ assignedDate: -1 });
  res.status(200).json({ success: true, data: items });
});

// GET /api/achievements/team
exports.getTeamAchievements = asyncHandler(async (req, res) => {
  const items = await Achievement.find({ isTeamAchievement: true, isActive: true })
    .populate("assignedTo", "name")
    .populate("assignedBy", "name")
    .sort({ assignedDate: -1 })
    .limit(10);

  res.status(200).json({ success: true, data: items });
});

// PATCH /api/achievements/:id/verify
exports.verifyAchievement = asyncHandler(async (req, res) => {
  const ach = await Achievement.findById(req.params.id);
  if (!ach) return res.status(404).json({ success: false, message: "Achievement not found" });

  ach.isActive = !ach.isActive;
  await ach.save();

  res.status(200).json({ success: true, data: ach });
});

// POST /api/achievements/:id/like
exports.toggleLike = asyncHandler(async (req, res) => {
  // Placeholder: implement like toggle
  res.status(200).json({ success: true, message: "Like toggled" });
});

// POST /api/achievements/:id/comment
exports.addComment = asyncHandler(async (req, res) => {
  // Placeholder: implement add comment
  res.status(200).json({ success: true, message: "Comment added" });
});

// GET /api/achievements/:id/comments
exports.getComments = asyncHandler(async (req, res) => {
  // Placeholder: implement get comments
  res.status(200).json({ success: true, data: [] });
});

// GET /api/achievements/stats
exports.getAchievementStats = asyncHandler(async (req, res) => {
  const total = await Achievement.countDocuments();
  const active = await Achievement.countDocuments({ isActive: true });
  const team = await Achievement.countDocuments({ isTeamAchievement: true });

  res.status(200).json({ success: true, data: { total, active, team } });
});

// GET /api/achievements/leaderboard
exports.getLeaderboard = asyncHandler(async (req, res) => {
  // Placeholder: implement leaderboard
  res.status(200).json({ success: true, data: [] });
});

// Additional utility endpoints (stats, leaderboard) can be added here as needed