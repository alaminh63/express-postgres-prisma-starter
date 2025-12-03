import { Request, Response } from 'express'
import sendResponse from '../../utils/sendResponse'
import catchAsync from '../../utils/catchAsync'
import authService from './auth.service'

/**
 * ============================================
 * 1. Send OTP Controller
 * POST /api/auth/send-otp
 * ============================================
 */
const sendOTP = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.sendOTP(req.body)
  
  sendResponse(res, {
    status: 200,
    success: true,
    message: 'OTP sent successfully',
    data: result
  })
})

/**
 * ============================================
 * 2. Verify OTP Controller
 * POST /api/auth/verify-otp
 * ============================================
 */
const verifyOTP = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.verifyOTP(req.body)
  
  if (result.userExists) {
    // Existing user - logged in
    sendResponse(res, {
      status: 200,
      success: true,
      message: 'Login successful',
      data: result
    })
  } else {
    // New user - needs to complete profile
    sendResponse(res, {
      status: 200,
      success: true,
      message: 'OTP verified. Please complete your profile.',
      data: result
    })
  }
})

/**
 * ============================================
 * 3. Complete Profile Controller
 * POST /api/auth/complete-profile
 * ============================================
 */
const completeProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.completeProfile(req.body)
  
  sendResponse(res, {
    status: 201,
    success: true,
    message: 'Account created successfully',
    data: result
  })
})

/**
 * ============================================
 * 4. Email Login Controller
 * POST /api/auth/login/email
 * ============================================
 */
const loginWithEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginWithEmail(req.body)
  
  sendResponse(res, {
    status: 200,
    success: true,
    message: 'Login successful',
    data: result
  })
})

/**
 * ============================================
 * 5. Resend OTP Controller
 * POST /api/auth/resend-otp
 * ============================================
 */
const resendOTP = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.resendOTP(req.body)
  
  sendResponse(res, {
    status: 200,
    success: true,
    message: 'OTP resent successfully',
    data: result
  })
})

/**
 * ============================================
 * 6. Get Current User Controller
 * GET /api/auth/me
 * ============================================
 */
const getMe = catchAsync(async (req: Request, res: Response) => {
  // Get user ID from JWT token (set by auth middleware)
  const userId = req.user?.id || req.user?.user_id
  
  if (!userId) {
    return sendResponse(res, {
      status: 401,
      success: false,
      message: 'User not authenticated',
      data: null
    })
  }
  
  const result = await authService.getMe({ userId: Number(userId) })
  
  sendResponse(res, {
    status: 200,
    success: true,
    message: 'User data retrieved successfully',
    data: result
  })
})

/**
 * Export all auth controllers
 */
export const authControllers = {
  sendOTP,
  verifyOTP,
  completeProfile,
  loginWithEmail,
  resendOTP,
  getMe
}
