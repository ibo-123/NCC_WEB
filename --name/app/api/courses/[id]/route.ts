import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api';
import Course from '@/models/Course.model';
import { authenticateUser } from '@/lib/serverAuth';

// GET /api/courses/[id] - Get single course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const course = await Course.findById(params.id)
      .populate('instructor', 'name')
      .populate('enrolledUsers', 'name studentId department');

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    // Check permissions for inactive courses
    const user = await authenticateUser(request);
    if (!course.isActive && user?.role !== 'admin' && user?.role !== 'president' && user?.role !== 'vice-president') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update course
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

    const course = await Course.findById(params.id);
    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isOwner = course.instructor.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'president' || user.role === 'vice-president';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Only course instructor or admin can update courses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, category, difficulty, tags, videoUrl, isActive } = body;

    const updatedCourse = await Course.findByIdAndUpdate(
      params.id,
      {
        title,
        description,
        category,
        difficulty,
        tags,
        videoUrl,
        isActive
      },
      { new: true, runValidators: true }
    ).populate('instructor', 'name')
     .populate('enrolledUsers', 'name studentId department');

    return NextResponse.json({
      success: true,
      data: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete course
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

    const course = await Course.findById(params.id);
    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isOwner = course.instructor.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'president' || user.role === 'vice-president';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Only course instructor or admin can delete courses' },
        { status: 403 }
      );
    }

    await Course.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete course' },
      { status: 500 }
    );
  }
}