/**
 * Chat Controller - Handles chat-related business logic
 */

import type { Request, Response } from 'express';
import { vertexAIRag } from '../services/vertexAIRagService';
const { VertexAI } = require('@google-cloud/vertexai');

export class ChatController {
  /**
   * Handle incoming chat message with Streaming and Memory
   */
  static async handleMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, sessionId } = req.body;

      if (!message || !sessionId) {
        res.status(400).json({ error: 'Missing message or sessionId' });
        return;
      }

      console.log(`[Chat] Session ${sessionId} - Message: ${message}`);

      // ✅ Use the correct RAG-powered retrieval via Gemini
      // This returns a complete answer, not just contexts
      const answer = await vertexAIRag.retrieveContextsWithRAG(message, 3);

      // Set Headers for SSE (Streaming)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream the answer word by word for better UX
      const words = answer.split(' ');
      let currentChunk = '';
      
      for (const word of words) {
        currentChunk += word + ' ';
        
        // Send chunk every 5 words or at the end
        if (currentChunk.split(' ').length >= 5 || word === words[words.length - 1]) {
          res.write(`data: ${JSON.stringify({ 
            type: 'chunk',
            content: currentChunk.trim()
          })}\n\n`);
          currentChunk = '';
        }
      }

      // Signal completion
      res.write(`data: ${JSON.stringify({ 
        type: 'complete',
        content: answer
      })}\n\n`);

      res.end();
    } catch (error: any) {
      console.error('Chat error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate response', message: error.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: 'Response generation failed' })}\n\n`);
        res.end();
      }
    }
  }
}