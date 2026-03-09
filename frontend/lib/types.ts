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
  instructor?: User;
  instructorId?: string;
  participants?: User[] | string[];
  enrolledCount?: number;
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
  date: string;
  time: string;
  location?: string;
  registeredCount?: number;
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
