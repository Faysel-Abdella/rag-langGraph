"use strict";
/**
 * Admin Routes - Routes for admin dashboard and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
/**
 * POST /api/admin/login
 * Admin login endpoint
 */
router.post('/api/admin/login', adminController_1.AdminController.login);
/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/api/admin/dashboard', adminController_1.AdminController.getDashboardStats);
/**
 * GET /api/admin/conversations
 * Get list of conversations
 */
router.get('/api/admin/conversations', adminController_1.AdminController.getConversations);
/**
 * GET /api/admin/escalations
 * Get list of escalations
 */
router.get('/api/admin/escalations', adminController_1.AdminController.getEscalations);
/**
 * POST /api/admin/documents/upload
 * Upload document for knowledge base
 */
router.post('/api/admin/documents/upload', adminController_1.AdminController.uploadDocument);
exports.default = router;
