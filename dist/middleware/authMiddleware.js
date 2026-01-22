"use strict";
/**
 * Authentication Middleware - Validates admin sessions
 * Phase 1: Basic session validation
 * Phase 3: Full Firebase authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireAuth = requireAuth;
function authMiddleware(req, res, next) {
    // TODO: Phase 3 - Replace with real Firebase token validation
    // For Phase 1, we check for session storage on client
    // In Phase 3, this will validate JWT tokens from Firebase
    // Public routes that don't require auth
    const publicRoutes = ['/health', '/widget.js', '/admin/login', '/api/chat'];
    const isPublicRoute = publicRoutes.some((route) => req.path.startsWith(route));
    if (isPublicRoute) {
        next();
        return;
    }
    // Check for admin routes - redirect to login if not authenticated
    if (req.path.startsWith('/admin')) {
        // In browser, client checks sessionStorage
        // For API calls, we would check Authorization header
        next();
        return;
    }
    next();
}
/**
 * Check if user is authenticated (for API endpoints)
 */
function requireAuth(req, res, next) {
    // TODO: Phase 3 - Validate JWT token from Authorization header
    // const token = req.headers.authorization?.replace('Bearer ', '');
    // if (!token) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }
    // For Phase 1, allow all authenticated requests
    next();
}
