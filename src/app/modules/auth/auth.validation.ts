import { z } from 'zod'

/**
 * Validation schema for sending OTP
 * POST /api/auth/send-otp
 */
export const sendOTPSchema = z.object({
  body: z.object({
    phone: z
      .string({
        required_error: 'Phone number is required',
        invalid_type_error: 'Phone must be a string'
      })
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number is too long')
      .regex(
        /^(\+91|91|0)?[6-9]\d{9}$/,
        'Invalid Indian phone number. Must start with 6-9 and be 10 digits'
      )
      .transform((val) => {
        // Normalize to +91XXXXXXXXXX format
        const digits = val.replace(/\D/g, '')
        if (digits.startsWith('91') && digits.length === 12) {
          return '+' + digits
        }
        if (digits.startsWith('0') && digits.length === 11) {
          return '+91' + digits.substring(1)
        }
        if (digits.length === 10) {
          return '+91' + digits
        }
        return '+91' + digits
      })
  })
})

/**
 * Validation schema for verifying OTP
 * POST /api/auth/verify-otp
 */
export const verifyOTPSchema = z.object({
  body: z.object({
    phone: z
      .string({
        required_error: 'Phone number is required'
      })
      .min(10, 'Phone number is required'),
    otp: z
      .string({
        required_error: 'OTP is required',
        invalid_type_error: 'OTP must be a string'
      })
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only numbers')
  })
})

/**
 * Validation schema for completing user profile (first-time users)
 * POST /api/auth/complete-profile
 */
export const completeProfileSchema = z.object({
  body: z.object({
    phone: z
      .string({
        required_error: 'Phone number is required'
      })
      .min(10, 'Phone number is required'),
    name: z
      .string({
        required_error: 'Name is required',
        invalid_type_error: 'Name must be a string'
      })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long')
      .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, dots, hyphens and apostrophes'),
    email: z
      .string()
      .email('Invalid email format')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password is too long')
      .optional()
      .or(z.literal('')),
    roleId: z
      .number()
      .int()
      .positive()
      .optional()
      .default(2) // Default to customer role (assuming 2 is customer)
  })
})

/**
 * Validation schema for email login
 * POST /api/auth/login/email
 */
export const emailLoginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string'
      })
      .email('Invalid email format')
      .min(5, 'Email is too short')
      .max(100, 'Email is too long'),
    password: z
      .string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string'
      })
      .min(1, 'Password is required')
  })
})

/**
 * Validation schema for resending OTP
 * POST /api/auth/resend-otp
 */
export const resendOTPSchema = z.object({
  body: z.object({
    phone: z
      .string({
        required_error: 'Phone number is required'
      })
      .min(10, 'Phone number is required')
      .transform((val) => {
        // Normalize phone format
        const digits = val.replace(/\D/g, '')
        if (digits.startsWith('91') && digits.length === 12) {
          return '+' + digits
        }
        if (digits.startsWith('0') && digits.length === 11) {
          return '+91' + digits.substring(1)
        }
        if (digits.length === 10) {
          return '+91' + digits
        }
        return '+91' + digits
      })
  })
})

/**
 * Export all schemas as a single object for easy import
 */
export const authValidation = {
  sendOTP: sendOTPSchema,
  verifyOTP: verifyOTPSchema,
  completeProfile: completeProfileSchema,
  emailLogin: emailLoginSchema,
  resendOTP: resendOTPSchema
}

