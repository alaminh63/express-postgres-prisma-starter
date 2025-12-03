import express from 'express'
import { authControllers } from './auth.controller'
import { authValidation } from './auth.validation'
import validateRequest from '../../middlewares/validateRequest'
import auth from '../../middlewares/auth'

const router = express.Router()

/**
 * ============================================
 * PUBLIC ROUTES (No authentication required)
 * ============================================
 */

/**
 * 1. Send OTP to phone number
 * POST /api/auth/send-otp
 */
router.post(
  '/send-otp',
  validateRequest(authValidation.sendOTP),
  authControllers.sendOTP
)

/**
 * 2. Verify OTP and login or start registration
 * POST /api/auth/verify-otp
 */
router.post(
  '/verify-otp',
  validateRequest(authValidation.verifyOTP),
  authControllers.verifyOTP
)

/**
 * 3. Complete profile for first-time users
 * POST /api/auth/complete-profile
 */
router.post(
  '/complete-profile',
  validateRequest(authValidation.completeProfile),
  authControllers.completeProfile
)

/**
 * 4. Login with email and password
 * POST /api/auth/login/email
 */
router.post(
  '/login/email',
  validateRequest(authValidation.emailLogin),
  authControllers.loginWithEmail
)

/**
 * 5. Resend OTP to phone number
 * POST /api/auth/resend-otp
 */
router.post(
  '/resend-otp',
  validateRequest(authValidation.resendOTP),
  authControllers.resendOTP
)

/**
 * ============================================
 * PROTECTED ROUTES (Authentication required)
 * ============================================
 */

/**
 * 6. Get current authenticated user data
 * GET /api/auth/me
 */
router.get(
  '/me',
  auth(), // Requires valid JWT token
  authControllers.getMe
)

export const authRoutes = router
