/**
 * Chat Controller - Handles chat-related business logic
 */

import type { Request, Response } from 'express';
import type { ChatMessage, ChatResponse } from '../models/chat';

export class ChatController {
  /**
   * Handle incoming chat message
   * Integrate with RAG pipeline
   */
  static async handleMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, sessionId }: ChatMessage = (req as any).body;

      // Validate input
      if (!message || !sessionId) {
        (res as any).status(400).json({
          error: 'Missing required fields: message, sessionId',
        });
        return;
      }

      // Log message (TODO: Store in Firestore - Phase 3)
      console.log(`[${sessionId}] User: ${message}`);

      // TODO:  RAG Pipeline
      // 1. Embed message with Vertex AI Embeddings
      // 2. Search Vertex AI Vector Search
      // 3. Construct prompt with retrieved context
      // 4. Call Gemini LLM
      // 5. Return grounded answer

      const response: ChatResponse = {
        answer:
          'This is a Phase 1 dummy response. In Phase 2, this will be powered by RAG with Vertex AI embeddings and Gemini LLM.',
        sessionId,
        confidence: 0.5,
        sources: [],
      };

      (res as any).json(response);
    } catch (error) {
      console.error('Chat error:', error);
      (res as any).status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
