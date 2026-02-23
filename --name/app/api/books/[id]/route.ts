import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api';
import Book from '@/models/Book.model';
import { authenticateUser } from '@/lib/serverAuth';

// GET /api/books/[id] - Get single book
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const book = await Book.findById(params.id)
      .populate('uploadedBy', 'name');

    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    // Check permissions for inactive books
    const user = await authenticateUser(request);
    if (!book.isActive && user?.role !== 'admin' && user?.role !== 'president' && user?.role !== 'vice-president') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Increment download count
    await Book.findByIdAndUpdate(params.id, { $inc: { downloads: 1 } });

    return NextResponse.json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Get book error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch book' },
      { status: 500 }
    );
  }
}

// PUT /api/books/[id] - Update book
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, message: 'Access denied. Only admin, president, or vice-president can update books' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, author, description, category, fileUrl, fileSize, coverImage, isActive } = body;

    const book = await Book.findByIdAndUpdate(
      params.id,
      {
        title,
        author,
        description,
        category,
        fileUrl,
        fileSize,
        coverImage,
        isActive
      },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name');

    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Update book error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update book' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id] - Delete book
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, message: 'Access denied. Only admin, president, or vice-president can delete books' },
        { status: 403 }
      );
    }

    const book = await Book.findByIdAndDelete(params.id);

    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete book' },
      { status: 500 }
    );
  }
}