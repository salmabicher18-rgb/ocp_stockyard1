/**
 * Centralized API client for the Node.js/Express backend.
 */

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let message: string;
    try {
      message = JSON.parse(text).error || text;
    } catch {
      message = text;
    }
    throw new ApiError(message, res.status);
  }

  return res.json();
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),

  post: <T = any>(path: string, data: any) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),

  put: <T = any>(path: string, data: any) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),

  delete: <T = any>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};

