// User model types
export interface User {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: string;
  role: 'admin' | 'president' | 'vice-president' | 'lecturer' | 'member';
  profileImage?: string;
  isPresident?: boolean;
  isVicePresident?: boolean;
  isLecturer?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Book model types
export interface Book {
  _id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  coverImage?: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: User;
  downloads: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Course model types
export interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  videoUrl?: string;
  instructor: User;
  enrolledUsers: {
    user: User;
    enrolledAt: string;
    progress: number;
    completed: boolean;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Achievement model types
export interface Achievement {
  _id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  date: string;
  assignedTo: User[];
  isTeamAchievement: boolean;
  links: string[];
  assignedBy: User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Dashboard stats types
export interface DashboardStats {
  overview: {
    totalUsers: number;
    totalAchievements: number;
    totalCourses: number;
    totalBooks: number;
    activeCourses: number;
    activeBooks: number;
    teamAchievements: number;
  };
  recentAchievements: Achievement[];
  userStats: { _id: string; count: number }[];
  monthlyUsers: { _id: { year: number; month: number }; count: number }[];
  achievementCategories: { _id: string; count: number }[];
}