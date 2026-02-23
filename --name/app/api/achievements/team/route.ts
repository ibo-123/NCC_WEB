import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api';
import Achievement from '@/models/Achievement.model';

// GET /api/achievements/team - Get team achievements for welcome page
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const achievements = await Achievement.find({
      isTeamAchievement: true,
      isActive: true
    })
    .populate('assignedTo', 'name')
    .populate('assignedBy', 'name')
    .sort({ date: -1 })
    .limit(10);

    return NextResponse.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Get team achievements error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch team achievements' },
      { status: 500 }
    );
  }
}