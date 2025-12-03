import prisma from '../../shared/prisma'
import bcrypt from 'bcryptjs'
import AppError from '../../errors/AppError'
import config from '../../config'
import { createToken } from '../../utils/commonUtils'
import { generateOTP } from '../../utils/commonUtils'
import { sendOTPSMS, formatPhoneForSMS } from '../../utils/sendSMS'
import {
  rateLimitOTPRequest,
  rateLimitOTPVerify,
  clearOTPVerifyRateLimit,
  rateLimitLogin,
  clearLoginRateLimit,
  rateLimitResendOTP
} from '../../utils/rateLimiter'

/**
 * ============================================
 * 1. SEND OTP - Send verification code to phone
 * POST /api/auth/send-otp
 * ============================================
 */
interface ISendOTPPayload {
  phone: string
}

const sendOTP = async (payload: ISendOTPPayload) => {
  const { phone } = payload

  // Format phone number
  const formattedPhone = formatPhoneForSMS(phone)

  // Rate limiting: Max 3 OTP requests per minute
  rateLimitOTPRequest(formattedPhone)

  // Generate 6-digit OTP
  const otp = generateOTP(6)

  // Set expiry: 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  // Check if user exists (to determine purpose)
  const existingUser = await prisma.user.findUnique({
    where: { phone: formattedPhone },
    select: { id: true, isVerified: true, status: true }
  })

  // Delete any existing OTP for this phone
  await prisma.otp.deleteMany({
    where: { phone: formattedPhone }
  })

  // Save OTP to database
  await prisma.otp.create({
    data: {
      phone: formattedPhone,
      otp: otp,
      purpose: existingUser ? 'LOGIN' : 'REGISTER',
      expiresAt: expiresAt,
      isUsed: false
    }
  })

  // Send OTP via SMS
  await sendOTPSMS(formattedPhone, otp)

  return {
    phone: formattedPhone,
    message: 'OTP sent successfully',
    expiresIn: 600, // seconds
    purpose: existingUser ? 'LOGIN' : 'REGISTER'
  }
}

/**
 * ============================================
 * 2. VERIFY OTP - Verify OTP and login or start registration
 * POST /api/auth/verify-otp
 * ============================================
 */
interface IVerifyOTPPayload {
  phone: string
  otp: string
}

const verifyOTP = async (payload: IVerifyOTPPayload) => {
  const { phone, otp } = payload

  const formattedPhone = formatPhoneForSMS(phone)

  // Rate limiting: Max 5 verification attempts per 10 minutes
  rateLimitOTPVerify(formattedPhone)

  // Find OTP record
  const otpRecord = await prisma.otp.findFirst({
    where: {
      phone: formattedPhone,
      isUsed: false
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if (!otpRecord) {
    throw new AppError(400, 'OTP_NOT_FOUND', 'No OTP found. Please request a new one.')
  }

  // Check if OTP is expired
  if (new Date() > otpRecord.expiresAt) {
    throw new AppError(400, 'OTP_EXPIRED', 'OTP has expired. Please request a new one.')
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    throw new AppError(400, 'OTP_INVALID', 'Invalid OTP. Please try again.')
  }

  // Mark OTP as used
  await prisma.otp.update({
    where: { id: otpRecord.id },
    data: { isUsed: true }
  })

  // Clear rate limit after successful verification
  clearOTPVerifyRateLimit(formattedPhone)

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { phone: formattedPhone },
    include: {
      role: {
        select: {
          id: true,
          roleName: true
        }
      }
    }
  })

  if (user) {
    // Existing user - login directly
    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'USER_BLOCKED', 'Your account is not active. Please contact support.')
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        isVerified: true // Ensure verified on login
      }
    })

    // Generate tokens
    const accessToken = createToken(
      { id: user.id, email: user.email, role: user.role.roleName, phone: user.phone },
      config.jwt_access_token_secret,
      config.jwt_access_token_expires_in
    )

    const refreshToken = createToken(
      { id: user.id, email: user.email, role: user.role.roleName, phone: user.phone },
      config.jwt_refresh_token_secret,
      config.jwt_refresh_token_expires_in
    )

    return {
      userExists: true,
      requiresRegistration: false,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.roleName,
        isVerified: user.isVerified,
        profileImage: user.profileImage
      }
    }
  } else {
    // New user - needs to complete registration
    return {
      userExists: false,
      requiresRegistration: true,
      phone: formattedPhone,
      message: 'OTP verified. Please complete your profile.'
    }
  }
}

/**
 * ============================================
 * 3. COMPLETE PROFILE - First-time user registration
 * POST /api/auth/complete-profile
 * ============================================
 */
interface ICompleteProfilePayload {
  phone: string
  name: string
  email?: string
  password?: string
  roleId?: number
}

const completeProfile = async (payload: ICompleteProfilePayload) => {
  const { phone, name, email, password, roleId = 2 } = payload

  const formattedPhone = formatPhoneForSMS(phone)

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { phone: formattedPhone }
  })

  if (existingUser) {
    throw new AppError(400, 'USER_EXISTS', 'User already exists. Please login.')
  }

  // Check if email is already taken (if provided)
  if (email && email.trim() !== '') {
    const emailExists = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    if (emailExists) {
      throw new AppError(400, 'EMAIL_EXISTS', 'Email is already registered.')
    }
  }

  // Verify that OTP was recently verified for this phone
  const recentOTP = await prisma.otp.findFirst({
    where: {
      phone: formattedPhone,
      isUsed: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if (!recentOTP || (Date.now() - recentOTP.createdAt.getTime()) > 10 * 60 * 1000) {
    throw new AppError(400, 'OTP_SESSION_EXPIRED', 'OTP session expired. Please verify phone again.')
  }

  // Hash password if provided
  let passwordHash = ''
  if (password && password.trim() !== '') {
    passwordHash = await bcrypt.hash(password, config.bcrypt_salt_rounds)
  } else {
    // Generate a random password hash (user can't login with email without setting password)
    passwordHash = await bcrypt.hash(Math.random().toString(36), config.bcrypt_salt_rounds)
  }

  // Create user
  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      phone: formattedPhone,
      email: email && email.trim() !== '' ? email.toLowerCase() : `${formattedPhone.replace('+', '')}@doorly.placeholder`,
      passwordHash: passwordHash,
      roleId: roleId,
      isVerified: true, // Phone is verified via OTP
      status: 'ACTIVE'
    },
    include: {
      role: {
        select: {
          id: true,
          roleName: true
        }
      }
    }
  })

  // Generate tokens
  const accessToken = createToken(
    { id: newUser.id, email: newUser.email, role: newUser.role.roleName, phone: newUser.phone },
    config.jwt_access_token_secret,
    config.jwt_access_token_expires_in
  )

  const refreshToken = createToken(
    { id: newUser.id, email: newUser.email, role: newUser.role.roleName, phone: newUser.phone },
    config.jwt_refresh_token_secret,
    config.jwt_refresh_token_expires_in
  )

  return {
    accessToken,
    refreshToken,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email.includes('@doorly.placeholder') ? null : newUser.email,
      phone: newUser.phone,
      role: newUser.role.roleName,
      isVerified: newUser.isVerified,
      profileImage: newUser.profileImage
    }
  }
}

/**
 * ============================================
 * 4. EMAIL LOGIN - Login with email + password
 * POST /api/auth/login/email
 * ============================================
 */
interface IEmailLoginPayload {
  email: string
  password: string
}

const loginWithEmail = async (payload: IEmailLoginPayload) => {
  const { email, password } = payload

  const lowercaseEmail = email.toLowerCase()

  // Rate limiting: Max 5 login attempts per 5 minutes
  rateLimitLogin(lowercaseEmail)

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: lowercaseEmail },
    include: {
      role: {
        select: {
          id: true,
          roleName: true
        }
      }
    }
  })

  if (!user) {
    throw new AppError(
      404,
      'USER_NOT_FOUND',
      'No account found with this email. Please login with your phone number.'
    )
  }

  // Check if account is active
  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'USER_BLOCKED', 'Your account is not active. Please contact support.')
  }

  // Check if email is placeholder (user registered without email)
  if (user.email.includes('@doorly.placeholder')) {
    throw new AppError(
      400,
      'EMAIL_NOT_SET',
      'Please login with your phone number.'
    )
  }

  // Verify password
  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash)

  if (!isPasswordCorrect) {
    throw new AppError(401, 'PASSWORD_INCORRECT', 'Incorrect password.')
  }

  // Clear rate limit after successful login
  clearLoginRateLimit(lowercaseEmail)

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  })

  // Generate tokens
  const accessToken = createToken(
    { id: user.id, email: user.email, role: user.role.roleName, phone: user.phone },
    config.jwt_access_token_secret,
    config.jwt_access_token_expires_in
  )

  const refreshToken = createToken(
    { id: user.id, email: user.email, role: user.role.roleName, phone: user.phone },
    config.jwt_refresh_token_secret,
    config.jwt_refresh_token_expires_in
  )

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.roleName,
      isVerified: user.isVerified,
      profileImage: user.profileImage
    }
  }
}

/**
 * ============================================
 * 5. RESEND OTP - Resend OTP to phone
 * POST /api/auth/resend-otp
 * ============================================
 */
interface IResendOTPPayload {
  phone: string
}

const resendOTP = async (payload: IResendOTPPayload) => {
  const { phone } = payload

  const formattedPhone = formatPhoneForSMS(phone)

  // Rate limiting: Max 2 resend requests per minute
  rateLimitResendOTP(formattedPhone)

  // Find the last OTP request
  const lastOTP = await prisma.otp.findFirst({
    where: { phone: formattedPhone },
    orderBy: { createdAt: 'desc' }
  })

  // Prevent resending too quickly (at least 30 seconds gap)
  if (lastOTP && (Date.now() - lastOTP.createdAt.getTime()) < 30 * 1000) {
    throw new AppError(
      429,
      'RESEND_TOO_SOON',
      'Please wait at least 30 seconds before requesting a new OTP.'
    )
  }

  // Generate new OTP
  const otp = generateOTP(6)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { phone: formattedPhone },
    select: { id: true }
  })

  // Delete old OTPs for this phone
  await prisma.otp.deleteMany({
    where: { phone: formattedPhone }
  })

  // Create new OTP
  await prisma.otp.create({
    data: {
      phone: formattedPhone,
      otp: otp,
      purpose: existingUser ? 'LOGIN' : 'REGISTER',
      expiresAt: expiresAt,
      isUsed: false
    }
  })

  // Send OTP via SMS
  await sendOTPSMS(formattedPhone, otp)

  return {
    phone: formattedPhone,
    message: 'OTP resent successfully',
    expiresIn: 600
  }
}

/**
 * ============================================
 * 6. GET CURRENT USER - Get authenticated user data
 * GET /api/auth/me
 * ============================================
 */
interface IGetMePayload {
  userId: number
}

const getMe = async (payload: IGetMePayload) => {
  const { userId } = payload

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        select: {
          id: true,
          roleName: true,
          permissions: true
        }
      }
    }
  })

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found.')
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'USER_BLOCKED', 'Your account is not active.')
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email.includes('@doorly.placeholder') ? null : user.email,
    phone: user.phone,
    role: user.role.roleName,
    roleId: user.roleId,
    isVerified: user.isVerified,
    profileImage: user.profileImage,
    status: user.status,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  }
}

/**
 * Export all auth services
 */
const authService = {
  sendOTP,
  verifyOTP,
  completeProfile,
  loginWithEmail,
  resendOTP,
  getMe
}

export default authService
