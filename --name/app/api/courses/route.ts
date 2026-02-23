import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api';
import Course from '@/models/Course.model';
import { authenticateUser } from '@/lib/serverAuth';

// GET /api/courses - Get all courses
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
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    const category = searchParams.get('category');
    if (category) {
      filter.category = category;
    }

    // Difficulty filter
    const difficulty = searchParams.get('difficulty');
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    // Only show active courses for non-admin users
    const user = await authenticateUser(request);
    if (user?.role !== 'admin' && user?.role !== 'president' && user?.role !== 'vice-president') {
      filter.isActive = true;
    }

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructor', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Course.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
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
    if (user.role !== 'admin' && user.role !== 'president' && user.role !== 'vice-president' && user.role !== 'lecturer') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Only admin, president, vice-president, or lecturer can create courses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, category, difficulty, tags, videoUrl, instructor } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, message: 'Title and description are required' },
        { status: 400 }
      );
    }

    const course = await Course.create({
      title,
      description,
      category,
      difficulty,
      tags: tags || [],
      videoUrl,
      instructor: instructor || user._id,
      enrolledUsers: [],
      isActive: true
    });

    return NextResponse.json(
      { success: true, data: course },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create course' },
      { status: 500 }
    );
  }
}