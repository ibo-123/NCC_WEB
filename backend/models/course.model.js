const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Course title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },

  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: [2000, "Description cannot exceed 2000 characters"]
  },

  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Programming Fundamentals", "Data Structures", "Algorithms", "Web Development", "Mobile Development", "Machine Learning", "Competitive Programming", "Software Engineering", "Databases", "DevOps", "Other"],
    default: "Programming Fundamentals"
  },

  difficulty: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Beginner"
  },

  videoType: {
    type: String,
    enum: ["youtube", "upload"],
    required: true
  },

  videoUrl: {
    type: String,
    required: function() {
      return this.videoType === "youtube";
    }
  },

  videoFile: {
    type: String,
    required: function() {
      return this.videoType === "upload";
    }
  },

  duration: {
    type: Number, // in minutes
    default: 0
  },

  tags: [{
    type: String,
    trim: true
  }],

  enrolledUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    enrolledDate: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model("Course", courseSchema);