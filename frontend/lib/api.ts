import { ApiError } from './types';

// Base URL should include the `/api` prefix so that frontend
// requests automatically target the correct route namespace.  An
// environment variable may already include `/api` (e.g. when
// deploying), so we normalize by trimming any trailing slash and
// ensuring `/api` is appended.
const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = rawUrl.replace(/\/+$/,'') + '/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async refreshToken(): Promise<boolean> {
    const token = this.getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const json = await response.json();
      if (json?.data?.token) {
        this.setAuthToken(json.data.token);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const json = await (async () => {
      try {
        return await response.json();
      } catch {
        return null;
      }
    })();

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      if (json && json.message) {
        errorMessage = json.message;
      }
      throw new Error(errorMessage || 'API request failed');
    }

    // Some APIs wrap payloads in { success, message, data: {...} }
    if (json && typeof json === 'object' && 'data' in json) {
      return json.data as T;
    }

    return (json as T) || ({} as T);
  }

  private async request<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const callApi = async () => {
      return await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
    };

    let response = await callApi();

    // Automatically try to refresh token once for expired tokens
    if (response.status === 401) {
      const body = await response.json().catch(() => null);
      const message = (body && (body.message || body.error)) ?? '';

      if (message.toLowerCase().includes('token has expired') || message.toLowerCase().includes('expired')) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          response = await callApi();
        }
      }
    }

    return this.handleResponse<T>(response);
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('PATCH', endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }
}

export const apiClient = new ApiClient();
