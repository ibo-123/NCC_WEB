// app/bookstore/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/UI/protectedRoutes";

interface Book {
  _id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  price: number;
  image?: string;
  stock: number;
  featured: boolean;
}

export default function BookstorePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("title");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      // For now, using mock data since backend doesn't have bookstore yet
      const mockBooks: Book[] = [
        {
          _id: "1",
          title: "Introduction to Algorithms",
          author: "Thomas H. Cormen",
          description:
            "Comprehensive guide to algorithms with practical implementations.",
          category: "Algorithms",
          price: 89.99,
          stock: 15,
          featured: true,
        },
        {
          _id: "2",
          title: "Clean Code",
          author: "Robert C. Martin",
          description: "A handbook of agile software craftsmanship.",
          category: "Software Engineering",
          price: 45.99,
          stock: 8,
          featured: false,
        },
        {
          _id: "3",
          title: "The Pragmatic Programmer",
          author: "Andrew Hunt and David Thomas",
          description: "Your journey to mastery in software development.",
          category: "Software Engineering",
          price: 52.99,
          stock: 12,
          featured: true,
        },
        {
          _id: "4",
          title: "Competitive Programming",
          author: "Steven Halim",
          description: "Essential guide for competitive programming contests.",
          category: "Competitive Programming",
          price: 67.99,
          stock: 6,
          featured: false,
        },
      ];
      setBooks(mockBooks);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedBooks = books
    .filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !filterCategory || book.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "author":
          return a.author.localeCompare(b.author);
        default:
          return a.title.localeCompare(b.title);
      }
    });

  const categories = [...new Set(books.map((b) => b.category))];
  const featuredBooks = books.filter((b) => b.featured);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-12 bg-muted rounded w-1/3 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-card p-6 rounded-lg">
                    <div className="h-48 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Programming Bookstore
            </h1>
            <p className="text-muted-foreground">
              Essential books for competitive programming and software
              development
            </p>
          </motion.div>

          {/* Featured Books */}
          {featuredBooks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Featured Books
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredBooks.map((book, index) => (
                  <motion.div
                    key={book._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-card p-6 rounded-lg border border-border hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-w-3 aspect-h-4 bg-muted rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-muted-foreground">📚</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      by {book.author}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {book.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ${book.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {book.stock} in stock
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card p-6 rounded-lg border border-border mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("");
                    setSortBy("title");
                  }}
                  className="w-full px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>

          {/* Books Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {filteredAndSortedBooks.map((book, index) => (
              <motion.div
                key={book._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-card p-6 rounded-lg border border-border hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-3 aspect-h-4 bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  by {book.author}
                </p>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {book.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-primary">
                    ${book.price}
                  </span>
                  <span
                    className={`text-sm ${book.stock > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {book.stock > 0 ? `${book.stock} in stock` : "Out of stock"}
                  </span>
                </div>
                <button
                  disabled={book.stock === 0}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {book.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
              </motion.div>
            ))}
          </motion.div>

          {filteredAndSortedBooks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground">
                No books found matching your criteria.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
