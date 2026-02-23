import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api';
import Book from '@/models/Book.model';
import { authenticateUser } from '@/lib/serverAuth';

// GET /api/books - Get all books
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Search
    const search = searchParams.get('search');
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    const category = searchParams.get('category');
    if (category) {
      filter.category = category;
    }

    // Only show active books for non-admin users
    const user = await authenticateUser(request);
    if (user?.role !== 'admin' && user?.role !== 'president' && user?.role !== 'vice-president') {
      filter.isActive = true;
    }

    const [books, total] = await Promise.all([
      Book.find(filter)
        .populate('uploadedBy', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Book.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

// POST /api/books - Create a new book
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    if (user.role !== 'admin' && user.role !== 'president' && user.role !== 'vice-president') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Only admin, president, or vice-president can upload books' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, author, description, category, fileUrl, fileSize, coverImage } = body;

    if (!title || !author || !fileUrl) {
      return NextResponse.json(
        { success: false, message: 'Title, author, and file URL are required' },
        { status: 400 }
      );
    }

    const book = await Book.create({
      title,
      author,
      description,
      category,
      fileUrl,
      fileSize,
      coverImage,
      uploadedBy: user._id,
      isActive: true
    });

    return NextResponse.json(
      { success: true, data: book },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create book error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create book' },
      { status: 500 }
    );
  }
}