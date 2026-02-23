const Book = require("../models/Book.model");
const asyncHandler = require("../middleware/catchMiddleware");

// @desc    Get all books
// @route   GET /api/books
// @access  Private (Members and above)
const getAllBooks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const category = req.query.category || "";

  let query = { isActive: true };

  if (search) {
    query.$text = { $search: search };
  }

  if (category) {
    query.category = category;
  }

  const books = await Book.find(query)
    .populate("uploadedBy", "name")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const count = await Book.countDocuments(query);

  res.status(200).json({
    success: true,
    count: books.length,
    total: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    books
  });
});

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Private (Members and above)
const getBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id)
    .populate("uploadedBy", "name");

  if (!book || !book.isActive) {
    return res.status(404).json({
      success: false,
      message: "Book not found"
    });
  }

  // Increment download count
  await Book.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

  res.status(200).json({
    success: true,
    book
  });
});

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Admin, President, Vice President)
const createBook = asyncHandler(async (req, res) => {
  const { title, author, description, category, coverImage, fileUrl, fileSize } = req.body;

  const book = await Book.create({
    title,
    author,
    description,
    category,
    coverImage,
    fileUrl,
    fileSize,
    uploadedBy: req.user._id
  });

  res.status(201).json({
    success: true,
    book
  });
});

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin, President, Vice President, or uploader)
const updateBook = asyncHandler(async (req, res) => {
  let book = await Book.findById(req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Book not found"
    });
  }

  // Check permissions
  if (req.user.role !== "admin" &&
      req.user.role !== "president" &&
      req.user.role !== "vice-president" &&
      book.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this book"
    });
  }

  book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    book
  });
});

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin, President, Vice President, or uploader)
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Book not found"
    });
  }

  // Check permissions
  if (req.user.role !== "admin" &&
      req.user.role !== "president" &&
      req.user.role !== "vice-president" &&
      book.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this book"
    });
  }

  await Book.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Book deleted successfully"
  });
});

// @desc    Get book categories
// @route   GET /api/books/categories
// @access  Public
const getBookCategories = asyncHandler(async (req, res) => {
  const categories = [
    "Programming",
    "Algorithms",
    "Data Structures",
    "Web Development",
    "Mobile Development",
    "Machine Learning",
    "Competitive Programming",
    "Software Engineering",
    "Databases",
    "Other"
  ];

  res.status(200).json({
    success: true,
    categories
  });
});

module.exports = {
  getAllBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getBookCategories
};