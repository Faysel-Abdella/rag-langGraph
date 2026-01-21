/**
 * Chat Model - Data interfaces and types
 */

export interface ChatMessage {
  message: string;
  sessionId: string;
}

export interface ChatResponse {
  answer: string;
  sessionId: string;
  confidence: number;
  sources: string[];
}

export interface Conversation {
  id: string;
  sessionId: string;
  messages: Array<{
    role: 'user' | 'bot';
    text: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Escalation {
  id: string;
  sessionId: string;
  userEmail?: string;
  question: string;
  reason: 'low_confidence' | 'out_of_scope' | 'user_request';
  status: 'pending' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt';
  size: number;
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  uploadedAt: Date;
  indexedAt?: Date;
  errorMessage?: string;
}
