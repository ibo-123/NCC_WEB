const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Book title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },

  author: {
    type: String,
    required: [true, "Author is required"],
    trim: true,
    maxlength: [100, "Author name cannot exceed 100 characters"]
  },

  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },

  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Programming", "Algorithms", "Data Structures", "Web Development", "Mobile Development", "Machine Learning", "Competitive Programming", "Software Engineering", "Databases", "Other"],
    default: "Programming"
  },

  coverImage: {
    type: String,
    default: ""
  },

  fileUrl: {
    type: String,
    required: [true, "Book file URL is required"]
  },

  fileSize: {
    type: Number,
    required: [true, "File size is required"]
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  uploadDate: {
    type: Date,
    default: Date.now
  },

  downloads: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search
bookSchema.index({ title: 'text', author: 'text', description: 'text' });

module.exports = mongoose.model("Book", bookSchema);