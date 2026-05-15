// ====== User & Auth ======
export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface UserSettings {
  id: number;
  user_id: number;
  api_key: string;
  api_base_url: string;
  model: string;
  language: 'zh' | 'en';
  theme: 'dark' | 'light' | 'anime';
  active_style_id: number | null;
}

// ====== Project ======
export interface Project {
  id: number;
  user_id: number;
  title: string;
  description: string;
  genre: string;
  setting: string;       // JSON string - world settings
  characters: string;    // JSON string - character profiles
  outline: string;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: number;
  project_id: number;
  title: string;
  content: string;
  chapter_outline: string;
  sort_order: number;
  status: 'draft' | 'revised' | 'final';
  word_count: number;
  created_at: string;
  updated_at: string;
}

// ====== AI & Agent ======
export type AgentMode = 'plan' | 'write' | 'auto';

export interface ChatMessage {
  id: number;
  user_id: number;
  project_id: number;
  chapter_id: number | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode: AgentMode | null;
  created_at: string;
}

export interface AIChatRequest {
  project_id: number;
  chapter_id?: number;
  message: string;
  mode: AgentMode;
  style_id?: number;
}

export interface AIChatResponse {
  message: string;
  mode_used: AgentMode;
  action?: {
    type: 'edit_chapter' | 'create_chapter' | 'update_outline';
    target_id?: number;
    content?: string;
    title?: string;
  };
}

// ====== Style Skill ======
export interface StyleProfile {
  id: number;
  user_id: number;
  name: string;
  type: 'preset' | 'custom' | 'extracted';
  description: string;
  style_prompt: string;
  sample_text: string | null;
  created_at: string;
}

// ====== API ======
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
