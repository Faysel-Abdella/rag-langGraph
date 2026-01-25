/**
 * Authentication Routes
 * Backend-based admin authentication using Firebase Auth
 */

import { Request, Response, Router } from 'express';

const router = Router();

/**
 * POST /api/auth/login
 * Backend login endpoint - avoids frontend API key issues
 * 
 * Request body:
 * {
 *   "email": "admin@example.com",
 *   "password": "admin1234"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJSUzI1NiIs...",
 *   "user": {
 *     "uid": "abc123",
 *     "email": "admin@example.com",
 *     "role": "admin"
 *   }
 * }
 */
router.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      (res as any).status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    // ============================================
    // SIMPLE AUTHENTICATION
    // For demo/development: hardcoded admin credentials
    // In production: Replace with proper user database
    // ============================================
    const validCredentials = [
      { email: 'admin@example.com', password: 'admin1234' },
      { email: 'admin@chatbot.com', password: 'password123' },
    ];

    const isValidUser = validCredentials.some(
      (cred) => cred.email === email && cred.password === password
    );

    if (!isValidUser) {
      console.log(`❌ Login attempt failed for ${email}`);
      (res as any).status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // ============================================
    // Generate a simple JWT-like token (for demo)
    // In production: Use proper JWT signing with secret key
    // ============================================
    const token = Buffer.from(
      JSON.stringify({
        email,
        role: 'admin',
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      })
    ).toString('base64');

    console.log(`✅ Login successful for ${email}`);

    (res as any).json({
      success: true,
      token,
      user: {
        uid: email,
        email,
        role: 'admin',
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    (res as any).status(500).json({
      success: false,
      error: 'Login failed: ' + error.message,
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify if an existing token is valid
 */
router.post('/api/auth/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      (res as any).status(400).json({
        success: false,
        error: 'Token is required',
      });
      return;
    }

    try {
      // Decode the base64 token
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as any;

      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now()) {
        (res as any).status(401).json({
          success: false,
          error: 'Token expired',
        });
        return;
      }

      (res as any).json({
        success: true,
        user: {
          uid: decoded.email,
          email: decoded.email,
          role: decoded.role,
        },
      });
    } catch (tokenError) {
      (res as any).status(401).json({
        success: false,
        error: 'Invalid token format',
      });
    }
  } catch (error: any) {
    console.error('Token verification error:', error);
    (res as any).status(401).json({
      success: false,
      error: 'Token verification failed',
    });
  }
});

export default router;
