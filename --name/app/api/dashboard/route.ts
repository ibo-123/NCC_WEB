import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/api';
import User from '@/models/User.model';
import Achievement from '@/models/Achievement.model';
import Course from '@/models/Course.model';
import Book from '@/models/Book.model';
import Attendance from '@/models/Attendance.model';
import { authenticateUser } from '@/lib/serverAuth';

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions - only admin, president, vice-president can access full dashboard
    if (user.role !== 'admin' && user.role !== 'president' && user.role !== 'vice-president') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get statistics
    const [
      totalUsers,
      totalAchievements,
      totalCourses,
      totalBooks,
      activeCourses,
      activeBooks,
      teamAchievements,
      recentAchievements,
      userStats
    ] = await Promise.all([
      User.countDocuments(),
      Achievement.countDocuments({ isActive: true }),
      Course.countDocuments(),
      Book.countDocuments(),
      Course.countDocuments({ isActive: true }),
      Book.countDocuments({ isActive: true }),
      Achievement.countDocuments({ isTeamAchievement: true, isActive: true }),
      Achievement.find({ isActive: true })
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      // User role distribution
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // Get monthly user registrations for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get achievement categories distribution
    const achievementCategories = await Achievement.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalAchievements,
          totalCourses,
          totalBooks,
          activeCourses,
          activeBooks,
          teamAchievements
        },
        recentAchievements,
        userStats,
        monthlyUsers,
        achievementCategories
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}