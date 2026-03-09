'use client';

import { useState, useEffect } from 'react';
import { apiClient } from './api';
import {
  Course,
  Event,
  Achievement,
  User,
  AttendanceRecord,
  DashboardStats,
  PaginatedResponse,
} from './types';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await apiClient.get<Course[]>('/courses');
        // ensure response is an array before updating state
        setCourses(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const enrollCourse = async (courseId: string) => {
    try {
      const response = await apiClient.post(`/courses/${courseId}/enroll`);
      const updatedCourses = await apiClient.get<Course[]>('/courses');
      setCourses(updatedCourses);
      return response;
    } catch (err) {
      throw err;
    }
  };

  return { courses, loading, error, enrollCourse };
}

export function useCourseDetail(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        const data = await apiClient.get<Course>(`/courses/${courseId}`);
        setCourse(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  return { course, loading, error };
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiClient.get<Event[]>('/events');
        setEvents(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const registerEvent = async (eventId: string) => {
    try {
      const response = await apiClient.post(`/events/${eventId}/register`);
      const updatedEvents = await apiClient.get<Event[]>('/events');
      setEvents(updatedEvents);
      return response;
    } catch (err) {
      throw err;
    }
  };

  return { events, loading, error, registerEvent };
}

export function useEventDetail(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      try {
        const data = await apiClient.get<Event>(`/events/${eventId}`);
        setEvent(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  return { event, loading, error };
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const data = await apiClient.get<Achievement[]>('/achievements');
        setAchievements(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch achievements');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  return { achievements, loading, error };
}

export function useUsers(role?: string) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const endpoint = role ? `/users?role=${role}` : '/users';
        const data = await apiClient.get<User[]>(endpoint);
        setUsers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [role]);

  return { users, loading, error };
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // The backend exposes admin and user endpoints; the combined
        // `/dashboard/stats` helper route will delegate based on role.
        const data = await apiClient.get<DashboardStats>('/dashboard/stats');
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

export function useAttendance(eventId?: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchAttendance = async () => {
      try {
        // backend supports filtering by eventId using query params
        const data = await apiClient.get<AttendanceRecord[]>(`/attendance?eventId=${eventId}`);
        setRecords(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [eventId]);

  return { records, loading, error };
}
