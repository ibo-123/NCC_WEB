const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Achievement title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },

  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },

  image: {
    type: String,
    default: ""
  },

  links: [{
    title: String,
    url: String
  }],

  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],

  isTeamAchievement: {
    type: Boolean,
    default: false
  },

  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  assignedDate: {
    type: Date,
    default: Date.now
  },

  category: {
    type: String,
    enum: ["Academic", "Competitive Programming", "Project", "Leadership", "Community", "Hackathon", "Certification", "Other"],
    default: "Other"
  },

  points: {
    type: Number,
    default: 0,
    min: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search
achievementSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model("Achievement", achievementSchema);