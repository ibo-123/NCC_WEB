import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api';
import Course from '@/models/Course.model';
import { authenticateUser } from '@/lib/serverAuth';

// POST /api/courses/[id]/enroll - Enroll in a course
export async function POST(
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

    if (!course.isActive) {
      return NextResponse.json(
        { success: false, message: 'Course is not active' },
        { status: 400 }
      );
    }

    // Check if user is already enrolled
    const isEnrolled = course.enrolledUsers.some(
      (enrolledUser: any) => enrolledUser.toString() === user._id.toString()
    );

    if (isEnrolled) {
      return NextResponse.json(
        { success: false, message: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Add user to enrolled users
    course.enrolledUsers.push({
      user: user._id,
      enrolledAt: new Date(),
      progress: 0,
      completed: false
    });

    await course.save();

    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error('Enroll course error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id]/enroll - Unenroll from a course
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

    // Remove user from enrolled users
    course.enrolledUsers = course.enrolledUsers.filter(
      (enrolledUser: any) => enrolledUser.user.toString() !== user._id.toString()
    );

    await course.save();

    return NextResponse.json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    console.error('Unenroll course error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to unenroll from course' },
      { status: 500 }
    );
  }
}