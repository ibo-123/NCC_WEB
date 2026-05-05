import { apiClient } from './api';
import type { AdminDashboardStats, DashboardStats, UserDashboardStats } from './types';

export const getDashboardStats = () => apiClient.get<DashboardStats>('/dashboard/stats');
export const getUserStats = () => apiClient.get<UserDashboardStats>('/dashboard/user');
export const getAdminDashboard = () => apiClient.get<AdminDashboardStats>('/dashboard/admin');
