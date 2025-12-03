import NodeCache from 'node-cache'
import AppError from '../errors/AppError'

/**
 * Simple in-memory rate limiter using node-cache
 * For production with multiple servers, use Redis instead
 */

// Cache instances for different rate limiting purposes
const otpRequestCache = new NodeCache({ stdTTL: 60 }) // 1 minute TTL
const otpVerifyCache = new NodeCache({ stdTTL: 600 }) // 10 minutes TTL
const loginCache = new NodeCache({ stdTTL: 300 }) // 5 minutes TTL

interface RateLimitOptions {
  maxAttempts: number
  windowSeconds: number
  errorMessage: string
}

/**
 * Check rate limit for a given key
 * @param cache - NodeCache instance to use
 * @param key - Unique identifier (e.g., phone number, email)
 * @param options - Rate limit configuration
 * @throws AppError if rate limit exceeded
 */
const checkRateLimit = (
  cache: NodeCache,
  key: string,
  options: RateLimitOptions
): void => {
  const attempts = cache.get<number>(key) || 0

  if (attempts >= options.maxAttempts) {
    throw new AppError(
      429,
      'RATE_LIMIT_EXCEEDED',
      options.errorMessage
    )
  }

  // Increment attempts
  cache.set(key, attempts + 1, options.windowSeconds)
}

/**
 * Clear rate limit for a key (call after successful action)
 * @param cache - NodeCache instance
 * @param key - Key to clear
 */
const clearRateLimit = (cache: NodeCache, key: string): void => {
  cache.del(key)
}

/**
 * Rate limit OTP sending (max 3 requests per minute per phone)
 * @param phone - Phone number
 */
export const rateLimitOTPRequest = (phone: string): void => {
  checkRateLimit(otpRequestCache, `otp_send:${phone}`, {
    maxAttempts: 3,
    windowSeconds: 60,
    errorMessage: 'Too many OTP requests. Please wait 1 minute before trying again.'
  })
}

/**
 * Rate limit OTP verification (max 5 attempts per 10 minutes per phone)
 * @param phone - Phone number
 */
export const rateLimitOTPVerify = (phone: string): void => {
  checkRateLimit(otpVerifyCache, `otp_verify:${phone}`, {
    maxAttempts: 5,
    windowSeconds: 600,
    errorMessage: 'Too many failed OTP attempts. Please request a new OTP.'
  })
}

/**
 * Clear OTP verification rate limit after successful verification
 * @param phone - Phone number
 */
export const clearOTPVerifyRateLimit = (phone: string): void => {
  clearRateLimit(otpVerifyCache, `otp_verify:${phone}`)
}

/**
 * Rate limit login attempts (max 5 attempts per 5 minutes per email)
 * @param email - Email address
 */
export const rateLimitLogin = (email: string): void => {
  checkRateLimit(loginCache, `login:${email}`, {
    maxAttempts: 5,
    windowSeconds: 300,
    errorMessage: 'Too many failed login attempts. Please try again in 5 minutes.'
  })
}

/**
 * Clear login rate limit after successful login
 * @param email - Email address
 */
export const clearLoginRateLimit = (email: string): void => {
  clearRateLimit(loginCache, `login:${email}`)
}

/**
 * Rate limit resend OTP (max 2 resends per minute per phone)
 * @param phone - Phone number
 */
export const rateLimitResendOTP = (phone: string): void => {
  checkRateLimit(otpRequestCache, `otp_resend:${phone}`, {
    maxAttempts: 2,
    windowSeconds: 60,
    errorMessage: 'Too many resend requests. Please wait 1 minute.'
  })
}

