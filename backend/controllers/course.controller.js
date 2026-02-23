const Course = require("../models/course.model");
const asyncHandler = require("../middleware/catchMiddleware");

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private (Members and above)
const getAllCourses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const category = req.query.category || "";
  const difficulty = req.query.difficulty || "";

  let query = { isActive: true };

  if (search) {
    query.$text = { $search: search };
  }

  if (category) {
    query.category = category;
  }

  if (difficulty) {
    query.difficulty = difficulty;
  }

  const courses = await Course.find(query)
    .populate("instructor", "name profileImage")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const count = await Course.countDocuments(query);

  res.status(200).json({
    success: true,
    count: courses.length,
    total: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    courses
  });
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private (Members and above)
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("instructor", "name profileImage bio")
    .populate("createdBy", "name")
    .populate("enrolledUsers.user", "name profileImage");

  if (!course || !course.isActive) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }

  // Increment views
  await Course.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  res.status(200).json({
    success: true,
    course
  });
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin, President, Vice President, Lecturer)
const createCourse = asyncHandler(async (req, res) => {
  const { title, description, category, difficulty, videoType, videoUrl, videoFile, duration, tags } = req.body;

  const course = await Course.create({
    title,
    description,
    instructor: req.user._id,
    category,
    difficulty,
    videoType,
    videoUrl,
    videoFile,
    duration,
    tags,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    course
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin, President, Vice President, Lecturer who created it)
const updateCourse = asyncHandler(async (req, res) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }

  // Check permissions
  const canEdit = req.user.role === "admin" ||
                  req.user.role === "president" ||
                  req.user.role === "vice-president" ||
                  (req.user.role === "lecturer" && course.createdBy.toString() === req.user._id.toString());

  if (!canEdit) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this course"
    });
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    course
  });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin, President, Vice President, Lecturer who created it)
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }

  // Check permissions
  const canDelete = req.user.role === "admin" ||
                    req.user.role === "president" ||
                    req.user.role === "vice-president" ||
                    (req.user.role === "lecturer" && course.createdBy.toString() === req.user._id.toString());

  if (!canDelete) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this course"
    });
  }

  await Course.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Course deleted successfully"
  });
});

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private (Members and above)
const enrollInCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course || !course.isActive) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }

  // Check if already enrolled
  const alreadyEnrolled = course.enrolledUsers.some(
    enrollment => enrollment.user.toString() === req.user._id.toString()
  );

  if (alreadyEnrolled) {
    return res.status(400).json({
      success: false,
      message: "Already enrolled in this course"
    });
  }

  course.enrolledUsers.push({
    user: req.user._id,
    enrolledDate: new Date()
  });

  await course.save();

  res.status(200).json({
    success: true,
    message: "Successfully enrolled in course"
  });
});

// @desc    Update course progress
// @route   PUT /api/courses/:id/progress
// @access  Private (Enrolled users)
const updateProgress = asyncHandler(async (req, res) => {
  const { progress, completed } = req.body;

  const course = await Course.findOneAndUpdate(
    {
      _id: req.params.id,
      "enrolledUsers.user": req.user._id
    },
    {
      $set: {
        "enrolledUsers.$.progress": progress,
        "enrolledUsers.$.completed": completed
      }
    },
    { new: true }
  );

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found or not enrolled"
    });
  }

  res.status(200).json({
    success: true,
    message: "Progress updated successfully"
  });
});

// @desc    Get course categories and difficulties
// @route   GET /api/courses/meta
// @access  Public
const getCourseMeta = asyncHandler(async (req, res) => {
  const categories = [
    "Programming Fundamentals",
    "Data Structures",
    "Algorithms",
    "Web Development",
    "Mobile Development",
    "Machine Learning",
    "Competitive Programming",
    "Software Engineering",
    "Databases",
    "DevOps",
    "Other"
  ];

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  res.status(200).json({
    success: true,
    categories,
    difficulties
  });
});

// @desc    Get course stats
// @route   GET /api/courses/stats
// @access  Private (Admin only)
const getCourseStats = asyncHandler(async (req, res) => {
  const totalCourses = await Course.countDocuments();
  const activeCourses = await Course.countDocuments({ isActive: true });
  const totalEnrollments = await Course.aggregate([
    { $unwind: '$enrolledUsers' },
    { $count: 'total' }
  ]);

  res.status(200).json({
    success: true,
    totalCourses,
    activeCourses,
    totalEnrollments: totalEnrollments[0]?.total || 0
  });
});

// @desc    Get my courses
// @route   GET /api/courses/my-courses
// @access  Private (Enrolled users)
const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({
    'enrolledUsers.user': req.user._id
  }).populate('instructor', 'name profileImage');

  res.status(200).json({
    success: true,
    courses
  });
});

// @desc    Complete a course
// @route   POST /api/courses/:id/complete
// @access  Private (Enrolled users)
const completeCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }

  const enrollment = course.enrolledUsers.find(
    e => e.user.toString() === req.user._id.toString()
  );

  if (!enrollment) {
    return res.status(400).json({
      success: false,
      message: "Not enrolled in this course"
    });
  }

  enrollment.completed = true;
  await course.save();

  res.status(200).json({
    success: true,
    message: "Course completed successfully"
  });
});

// @desc    Rate a course
// @route   POST /api/courses/:id/rate
// @access  Private (Enrolled users)
const rateCourse = asyncHandler(async (req, res) => {
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5"
    });
  }

  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }

  const enrollment = course.enrolledUsers.find(
    e => e.user.toString() === req.user._id.toString()
  );

  if (!enrollment) {
    return res.status(400).json({
      success: false,
      message: "Not enrolled in this course"
    });
  }

  enrollment.rating = rating;
  await course.save();

  res.status(200).json({
    success: true,
    message: "Course rated successfully"
  });
});

module.exports = {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  updateProgress,
  getCourseMeta,
  getCourseStats,
  getMyCourses,
  completeCourse,
  rateCourse
};