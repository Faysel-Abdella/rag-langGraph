"use strict";
/**
 * Chat Routes - Routes for chat functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const router = (0, express_1.Router)();
/**
 * POST /api/chat
 * Handle incoming chat messages
 */
router.post('/api/chat', chatController_1.ChatController.handleMessage);
exports.default = router;
