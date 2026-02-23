import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api';
import Achievement from '@/models/Achievement.model';
import { authenticateUser } from '@/lib/serverAuth';

// GET /api/achievements/[id] - Get single achievement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const achievement = await Achievement.findById(params.id)
      .populate('assignedBy', 'name')
      .populate('assignedTo', 'name studentId department profileImage');

    if (!achievement) {
      return NextResponse.json(
        { success: false, message: 'Achievement not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const user = await authenticateUser(request);
    if (!achievement.isActive && user?.role !== 'admin' && user?.role !== 'president' && user?.role !== 'vice-president') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: achievement
    });
  } catch (error) {
    console.error('Get achievement error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch achievement' },
      { status: 500 }
    );
  }
}

// PUT /api/achievements/[id] - Update achievement
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
        { success: false, message: 'Access denied. Only admin, president, or vice-president can update achievements' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, category, points, date, assignedTo, isTeamAchievement, links, isActive } = body;

    const achievement = await Achievement.findByIdAndUpdate(
      params.id,
      {
        title,
        description,
        category,
        points,
        date,
        assignedTo,
        isTeamAchievement,
        links,
        isActive
      },
      { new: true, runValidators: true }
    ).populate('assignedBy', 'name')
     .populate('assignedTo', 'name studentId department profileImage');

    if (!achievement) {
      return NextResponse.json(
        { success: false, message: 'Achievement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: achievement
    });
  } catch (error) {
    console.error('Update achievement error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update achievement' },
      { status: 500 }
    );
  }
}

// DELETE /api/achievements/[id] - Delete achievement
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
        { success: false, message: 'Access denied. Only admin, president, or vice-president can delete achievements' },
        { status: 403 }
      );
    }

    const achievement = await Achievement.findByIdAndDelete(params.id);

    if (!achievement) {
      return NextResponse.json(
        { success: false, message: 'Achievement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Achievement deleted successfully'
    });
  } catch (error) {
    console.error('Delete achievement error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete achievement' },
      { status: 500 }
    );
  }
}