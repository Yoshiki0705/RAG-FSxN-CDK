// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Health Check Types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: string;
  version?: string;
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Document Types
export interface Document {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Search Result Types
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

// User Types
export interface User {
  id: string;
  username: string;
  email?: string;
  permissions?: string[];
}

// Chat Types
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sessionId?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Bedrock Types
export interface BedrockModel {
  id: string;
  name: string;
  description: string;
  provider: string;
}

export interface BedrockParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
}