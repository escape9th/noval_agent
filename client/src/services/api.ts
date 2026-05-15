import type { Project, Chapter } from '@shared/types';

const API_BASE = '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options;

  const token = localStorage.getItem('token');

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    signal,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
  }

  const json = await response.json();
  // Server wraps responses in { success, data } — unwrap automatically
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

// SSE streaming request for AI chat
export async function streamRequest(
  endpoint: string,
  body: unknown,
  onChunk: (chunk: string) => void,
  onDone: (result?: any) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('ReadableStream not supported');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'chunk' && parsed.content) {
            onChunk(parsed.content);
          } else if (parsed.type === 'done' && parsed.result) {
            onDone(parsed.result);
            return;
          } else if (parsed.type === 'error') {
            onError(new Error(parsed.error));
            return;
          }
        } catch {
          // Incomplete JSON from buffer split — skip
        }
      }
    }
    // Process any remaining buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'chunk' && parsed.content) onChunk(parsed.content);
          else if (parsed.type === 'done') { onDone(parsed.result); return; }
        } catch {}
      }
    }
    onDone();
  } catch (err) {
    if (signal?.aborted) return;
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string } }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    }),

  register: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string } }>('/auth/register', {
      method: 'POST',
      body: { username, password },
    }),
};

// Settings API
export interface Settings {
  api_key: string;
  api_base_url: string;
  model: string;
  language: string;
  theme: string;
}

export const settingsApi = {
  get: () => request<Settings>('/settings'),
  update: (settings: Partial<Settings>) =>
    request<Settings>('/settings', { method: 'PUT', body: settings }),
};

// Projects API
export const projectsApi = {
  list: () => request<Project[]>('/projects'),
  get: (id: string | number) => request<Project>(`/projects/${id}`),
  create: (data: { title: string; description?: string; genre?: string }) =>
    request<Project>('/projects', { method: 'POST', body: data }),
  update: (id: string | number, data: { title?: string; description?: string }) =>
    request<Project>(`/projects/${id}`, { method: 'PUT', body: data }),
  delete: (id: string | number) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),
};

// Chapters API
export const chaptersApi = {
  list: (projectId: string | number) => request<Chapter[]>(`/chapters/project/${projectId}`),
  get: (id: string | number) => request<Chapter>(`/chapters/${id}`),
  create: (data: { project_id: string | number; title: string; content?: string; chapter_outline?: string }) =>
    request<Chapter>('/chapters', { method: 'POST', body: data }),
  update: (id: string | number, data: { title?: string; content?: string; sort_order?: number }) =>
    request<Chapter>(`/chapters/${id}`, { method: 'PUT', body: data }),
  delete: (id: string | number) =>
    request<void>(`/chapters/${id}`, { method: 'DELETE' }),
};

// AI API
export const aiApi = {
  chat: (
    body: {
      message: string;
      context?: string;
      style?: string;
      project_id?: string;
      chapter_id?: string;
    },
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void,
    signal?: AbortSignal,
  ) => streamRequest('/ai/chat', body, onChunk, onDone, onError, signal),
};

// Styles API
export interface WritingStyle {
  id: number;
  name: string;
  description: string;
  sample: string;
  created_at: string;
}

export const stylesApi = {
  list: () => request<WritingStyle[]>('/styles'),
  get: (id: string | number) => request<WritingStyle>(`/styles/${id}`),
  create: (data: { name: string; description: string; sample: string }) =>
    request<WritingStyle>('/styles', { method: 'POST', body: data }),
  update: (id: string | number, data: { name?: string; description?: string; sample?: string }) =>
    request<WritingStyle>(`/styles/${id}`, { method: 'PUT', body: data }),
  delete: (id: string | number) =>
    request<void>(`/styles/${id}`, { method: 'DELETE' }),
  extract: (text: string) =>
    request<{ name: string; description: string; sample: string }>('/styles/extract', {
      method: 'POST',
      body: { text },
    }),
};

// Default export for backward-compatible generic HTTP access (api.get, api.post, api.delete)
const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
