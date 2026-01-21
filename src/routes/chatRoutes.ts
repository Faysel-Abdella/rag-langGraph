/**
 * Chat Routes - Routes for chat functionality
 */

import { Router } from 'express';
import { ChatController } from '../controllers/chatController';

const router = Router();

/**
 * POST /api/chat
 * Handle incoming chat messages
 */
router.post('/api/chat', ChatController.handleMessage);

export default router;
