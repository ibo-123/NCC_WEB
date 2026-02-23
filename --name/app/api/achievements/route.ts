import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api';
import Achievement from '@/models/Achievement.model';
import { authenticateUser } from '@/lib/serverAuth';

// GET /api/achievements - Get all achievements
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Basic filters
    const category = searchParams.get('category');
    if (category) {
      filter.category = category;
    }

    const isTeamAchievement = searchParams.get('isTeamAchievement');
    if (isTeamAchievement !== null) {
      filter.isTeamAchievement = isTeamAchievement === 'true';
    }

    // Search
    const search = searchParams.get('search');
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based visibility
    const user = await authenticateUser(request);
    if (user?.role !== 'admin' && user?.role !== 'president' && user?.role !== 'vice-president') {
      filter.isActive = true;
    }

    // Sort
    const sortBy = searchParams.get('sortBy');
    let sort: any = { createdAt: -1 };
    if (sortBy === 'date') {
      sort = { date: -1 };
    }

    const [achievements, total] = await Promise.all([
      Achievement.find(filter)
        .populate('assignedBy', 'name')
        .populate('assignedTo', 'name studentId department profileImage')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      Achievement.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      data: achievements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

// POST /api/achievements - Create a new achievement
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
        { success: false, message: 'Access denied. Only admin, president, or vice-president can create achievements' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, category, points, date, assignedTo, isTeamAchievement, links } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, message: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Validate assignedTo users exist
    if (assignedTo && assignedTo.length > 0) {
      // We'll validate this in the controller, but for now assume they're valid
    }

    const achievement = await Achievement.create({
      title,
      description,
      category,
      points: points || 0,
      date: date || new Date(),
      assignedTo,
      isTeamAchievement: isTeamAchievement || false,
      links: links || [],
      assignedBy: user._id,
      isActive: true
    });

    return NextResponse.json(
      { success: true, data: achievement },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create achievement error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create achievement' },
      { status: 500 }
    );
  }
}