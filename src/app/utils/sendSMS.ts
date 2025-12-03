/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from '../errors/AppError'
import config from '../config'

/**
 * SMS Service Configuration
 * 
 * PRODUCTION SETUP:
 * 1. For India: Use MSG91, Fast2SMS, or Twilio
 * 2. Add to .env:
 *    - SMS_PROVIDER=MSG91  (or FAST2SMS, TWILIO)
 *    - SMS_API_KEY=your_api_key
 *    - SMS_SENDER_ID=your_sender_id
 *    - SMS_TEMPLATE_ID=your_template_id (for DLT compliance)
 * 
 * 3. Install provider SDK: npm install msg91-nodejs (or respective SDK)
 */

/**
 * Send OTP via SMS
 * @param phone - Phone number in format +919876543210
 * @param otp - 6-digit OTP code
 * @returns Promise that resolves when SMS is sent
 * @throws AppError if SMS sending fails
 */
export const sendOTPSMS = async (
  phone: string,
  otp: string
): Promise<void> => {
  try {
    // Validate inputs
    if (!phone || !otp) {
      throw new AppError(400, 'SMS_INVALID_INPUT', 'Phone and OTP are required')
    }

    // DEVELOPMENT MODE: Just log the OTP
    if (config.NODE_ENV === 'development') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📱 OTP SMS (Development Mode)')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`Phone: ${phone}`)
      console.log(`OTP: ${otp}`)
      console.log(`Message: Your Doorly verification code is ${otp}. Valid for 10 minutes.`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return
    }

    // PRODUCTION MODE: Integrate with SMS provider
    // Uncomment and configure based on your provider

    /* 
    // Example: MSG91 (Popular in India, DLT compliant)
    const MSG91 = require('msg91-nodejs').default
    const msg91 = new MSG91(config.sms_api_key)
    
    await msg91.sendSMS({
      sender: config.sms_sender_id,
      route: '4', // Transactional route
      country: '91',
      sms: [
        {
          message: `Your Doorly verification code is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
          to: [phone.replace('+91', '')]
        }
      ]
    })
    */

    /* 
    // Example: Fast2SMS (Cheaper alternative)
    const axios = require('axios')
    
    await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'dlt',
      sender_id: config.sms_sender_id,
      message: config.sms_template_id,
      variables_values: otp,
      numbers: phone.replace('+91', '')
    }, {
      headers: {
        'authorization': config.sms_api_key
      }
    })
    */

    /* 
    // Example: Twilio (International)
    const twilio = require('twilio')
    const client = twilio(config.twilio_account_sid, config.twilio_auth_token)
    
    await client.messages.create({
      body: `Your Doorly verification code is ${otp}. Valid for 10 minutes.`,
      from: config.twilio_phone_number,
      to: phone
    })
    */

    // If no provider is configured in production, throw error
    throw new AppError(
      500,
      'SMS_NOT_CONFIGURED',
      'SMS service is not configured. Please set up SMS provider.'
    )

  } catch (error: any) {
    console.error('SMS sending failed:', {
      phone,
      error: error.message,
      stack: error.stack
    })

    // Don't expose internal errors in production
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      500,
      'SMS_SEND_ERROR',
      config.NODE_ENV === 'development' 
        ? `Failed to send SMS: ${error.message}`
        : 'Failed to send verification code. Please try again.'
    )
  }
}

/**
 * Format phone number for SMS sending
 * @param phone - Raw phone number
 * @returns Formatted phone number with country code
 */
export const formatPhoneForSMS = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // If starts with 91 and has 12 digits, add +
  if (digits.startsWith('91') && digits.length === 12) {
    return '+' + digits
  }
  
  // If starts with 0 (Indian number), replace with +91
  if (digits.startsWith('0') && digits.length === 11) {
    return '+91' + digits.substring(1)
  }
  
  // If 10 digits, assume Indian number
  if (digits.length === 10) {
    return '+91' + digits
  }
  
  // If already has +, return as-is
  if (phone.startsWith('+')) {
    return phone
  }
  
  // Default: assume Indian number
  return '+91' + digits
}

