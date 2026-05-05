// Auth types
export type UserRole =
  | 'member'
  | 'admin'
  | 'president'
  | 'vice-president'
  | 'lecturer'
  | 'user' // legacy value used by some components
  | 'instructor';

export interface User {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password?: string;
  profilePicture?: string;
  bio?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}

// Course types
export interface Course {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  videoType?: "youtube" | "upload";
  videoUrl?: string;
  videoFile?: string;
  materials?: {
    title: string;
    type: "pdf" | "ppt" | "doc" | "link" | "other";
    url: string;
    description?: string;
  }[];
  instructor?: User | string;
  instructorId?: string;
  enrolledUsers?: Array<{ user: User | string }>;    
  enrolledCount?: number;
  createdBy?: User | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseEnrollment {
  userId: string;
  courseId: string;
  enrolledAt?: string;
}

// Event types
export interface Event {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  date?: string;
  time?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  status?: string;
  registeredCount?: number;
  attendees?: Array<{ user?: User | string }>;
  isFull?: boolean;
  maxCapacity?: number;
  createdBy?: User;
  createdById?: string;
  registeredUsers?: User[] | string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EventRegistration {
  userId: string;
  eventId: string;
  registeredAt?: string;
}

// Achievement types
export interface Achievement {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  icon?: string;
  points?: number;
  awardedTo?: User[] | string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AchievementAward {
  userId: string;
  achievementId: string;
  awardedAt?: string;
}

// Attendance types
export interface AttendanceRecord {
  _id?: string;
  id?: string;
  userId: string;
  eventId: string;
  status: 'present' | 'absent' | 'late';
  markedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEvents: number;
  totalAchievements: number;
}

export interface DashboardUserProfile {
  name: string;
  email: string;
  studentId?: string;
  department?: string;
  year?: string;
  role: UserRole;
}

export interface SummaryItem {
  title: string;
  category: string;
  date: string;
}

export interface EventSummary {
  title: string;
  date: string;
  status?: string;
  type?: string;
}

export interface CategoryCount {
  name: string;
  value: number;
}

export interface ChartPoint {
  month: string;
  value: number;
}

export interface UserDashboardStats {
  profile: DashboardUserProfile;
  attendancePercentage: number;
  totalEvents: number;
  attendedEvents: number;
  achievements: SummaryItem[];
  recentEvents: EventSummary[];
  upcomingEvents: EventSummary[];
  monthlyAttendance: ChartPoint[];
  achievementsByCategory: CategoryCount[];
  attendanceByType: CategoryCount[];
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalAchievements: number;
  totalCourses: number;
  recentUsers: Array<{ name: string; email: string; joinedDate: string }>;
  recentEvents: Array<{ title: string; status: string; date: string }>;
  recentAchievements: Array<{ userName: string; achievementTitle: string }>;
  userGrowth: ChartPoint[];
  attendanceOverview: CategoryCount[];
}

// Error response type
export interface ApiError {
  message: string;
  error?: string;
  status?: number;
}

// Pagination type
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
