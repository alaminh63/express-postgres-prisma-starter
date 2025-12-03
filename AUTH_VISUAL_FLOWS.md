# 📱 Doorly Authentication - Visual User Flows

## 🎨 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   USER OPENS APP                            │
│                 (Login Screen)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   Two Options:                     │
        │   [Phone Login]  [Email Login]     │
        └────────┬───────────────────┬───────┘
                 │                   │
        ┌────────▼────────┐  ┌──────▼──────────┐
        │ PHONE FLOW      │  │ EMAIL FLOW      │
        └────────┬────────┘  └──────┬──────────┘
                 │                   │
                 │                   │
   ╔═════════════╧═════════════╗    │
   ║   PHONE LOGIN FLOW        ║    │
   ║   (90% of users)          ║    │
   ╚═════════════╤═════════════╝    │
                 │                   │
        ┌────────▼────────┐          │
        │ Enter Phone #   │          │
        │ (e.g. 9876543210)│          │
        └────────┬────────┘          │
                 │                   │
                 ▼                   │
        POST /api/auth/send-otp     │
                 │                   │
        ┌────────▼────────┐          │
        │  SMS Sent ✓     │          │
        │  (OTP: 123456)  │          │
        └────────┬────────┘          │
                 │                   │
        ┌────────▼────────┐          │
        │  Enter OTP      │          │
        │  (User types)   │          │
        └────────┬────────┘          │
                 │                   │
                 ▼                   │
        POST /api/auth/verify-otp   │
                 │                   │
        ┌────────▼────────┐          │
        │  Check User?    │          │
        └────────┬────────┘          │
                 │                   │
        ┌────────┴─────────┐         │
        │                  │         │
   ┌────▼─────┐      ┌────▼──────┐  │
   │ Exists?  │      │ New User? │  │
   └────┬─────┘      └────┬──────┘  │
        │                 │         │
        │                 ▼         │
        │    ┌──────────────────────────┐
        │    │ "What's your name?"      │
        │    │ (Enter Name)             │
        │    └──────────┬───────────────┘
        │               │
        │               ▼
        │    ┌──────────────────────────┐
        │    │ Optional: Email/Password │
        │    │ [Skip] or [Set]          │
        │    └──────────┬───────────────┘
        │               │
        │               ▼
        │    POST /api/auth/complete-profile
        │               │
        │               │
        │    ┌──────────▼───────────────┐
        │    │ Create User              │
        │    │ isVerified = true        │
        │    └──────────┬───────────────┘
        │               │
        └───────────────┴───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   GENERATE JWT TOKENS         │
        │   - accessToken (1h)          │
        │   - refreshToken (90d)        │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   ✅ LOGIN SUCCESS!           │
        │   Redirect to Home Screen     │
        └───────────────────────────────┘




   ╔═════════════════════════════════╗
   ║   EMAIL LOGIN FLOW              ║
   ║   (10% of returning users)      ║
   ╚═════════════╤═══════════════════╝
                 │
        ┌────────▼────────┐
        │ Enter Email     │
        │ (john@email.com)│
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Enter Password  │
        │ (••••••••)      │
        └────────┬────────┘
                 │
                 ▼
        POST /api/auth/login/email
                 │
        ┌────────▼────────┐
        │  Check User?    │
        └────────┬────────┘
                 │
        ┌────────┴─────────┐
        │                  │
   ┌────▼─────┐      ┌────▼──────────────┐
   │ Exists?  │      │ Not Found?        │
   └────┬─────┘      └────┬──────────────┘
        │                 │
        │                 ▼
        │      ┌──────────────────────────┐
        │      │ Error: "No account found"│
        │      │ "Please use phone number"│
        │      └──────────────────────────┘
        │
        ▼
   ┌──────────────────┐
   │ Check Password?  │
   └────────┬─────────┘
            │
   ┌────────┴─────────┐
   │                  │
┌──▼──────┐    ┌──────▼──────┐
│Correct? │    │ Wrong?      │
└──┬──────┘    └──────┬──────┘
   │                  │
   │                  ▼
   │      ┌──────────────────────┐
   │      │ Error: "Incorrect    │
   │      │        password"      │
   │      └──────────────────────┘
   │
   ▼
┌───────────────────────────────┐
│   GENERATE JWT TOKENS         │
│   - accessToken (1h)          │
│   - refreshToken (90d)        │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│   ✅ LOGIN SUCCESS!           │
│   Redirect to Home Screen     │
└───────────────────────────────┘
```

---

## 🔄 OTP Resend Flow

```
User on OTP Screen
      │
      ▼
┌─────────────────┐
│ "Didn't receive │
│  OTP? Resend"   │
└────────┬────────┘
         │
         ▼
POST /api/auth/resend-otp
         │
    ┌────▼─────┐
    │ Check:   │
    │ - Rate   │
    │ - Last   │
    │   sent   │
    └────┬─────┘
         │
    ┌────▼──────────────────┐
    │ Delete old OTP        │
    │ Generate new OTP      │
    │ Send new SMS          │
    └────┬──────────────────┘
         │
         ▼
┌──────────────────┐
│ New OTP sent ✓   │
│ (Check SMS/console)│
└──────────────────┘
```

---

## 🛡️ Rate Limiting Visual

```
┌─────────────────────────────────────────────────────────┐
│                 RATE LIMITING                           │
└─────────────────────────────────────────────────────────┘

OTP SEND (per phone):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request 1  ✓  (0:00)
Request 2  ✓  (0:15)
Request 3  ✓  (0:30)
Request 4  ❌  (0:45) → "Wait 1 minute"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Max: 3 requests per minute


OTP VERIFY (per phone):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Attempt 1  ✓  Wrong OTP
Attempt 2  ✓  Wrong OTP
Attempt 3  ✓  Wrong OTP
Attempt 4  ✓  Wrong OTP
Attempt 5  ✓  Wrong OTP
Attempt 6  ❌  Blocked → "Request new OTP"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Max: 5 attempts per 10 minutes


EMAIL LOGIN (per email):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Attempt 1  ✓  Wrong password
Attempt 2  ✓  Wrong password
Attempt 3  ✓  Wrong password
Attempt 4  ✓  Wrong password
Attempt 5  ✓  Wrong password
Attempt 6  ❌  Blocked → "Wait 5 minutes"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Max: 5 attempts per 5 minutes
```

---

## ⏱️ OTP Lifecycle

```
┌──────────────────────────────────────────────────────────┐
│               OTP LIFECYCLE                              │
└──────────────────────────────────────────────────────────┘

0:00 ─┬─ OTP Created
      │   - 6 digits generated
      │   - Saved to DB
      │   - SMS sent
      │   - expiresAt = now + 10 min
      │
2:00  │   [User enters correct OTP]
      │   - OTP verified ✓
      │   - isUsed = true
      │   - Cannot reuse
      │
      │   [If user enters wrong OTP]
      │   - Error returned ❌
      │   - OTP remains valid
      │   - Can retry (rate limited)
      │
10:00 ┴─ OTP Expires
          - Cannot be used anymore
          - User must request new OTP


┌──────────────────────────────────────────────────────────┐
│           NEW OTP REQUESTED                              │
└──────────────────────────────────────────────────────────┘

Old OTP:
  - Status: Deleted from DB ❌
  - Cannot be used anymore

New OTP:
  - Fresh 6 digits generated
  - New expiry (10 min)
  - Old SMS ignored
```

---

## 🔐 JWT Token Flow

```
┌──────────────────────────────────────────────────────────┐
│              JWT TOKEN LIFECYCLE                         │
└──────────────────────────────────────────────────────────┘

Login Success
     │
     ▼
┌─────────────────────────────────────┐
│ Server generates:                   │
│                                     │
│ accessToken (1 hour)                │
│ ┌─────────────────────────────┐   │
│ │ { id, email, phone, role }  │   │
│ │ Signed with JWT_SECRET      │   │
│ └─────────────────────────────┘   │
│                                     │
│ refreshToken (90 days)              │
│ ┌─────────────────────────────┐   │
│ │ { id, email, phone, role }  │   │
│ │ Signed with REFRESH_SECRET  │   │
│ └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Client stores tokens:                │
│ - localStorage (web)                 │
│ - SecureStorage (mobile)             │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ API requests:                        │
│ Authorization: Bearer <accessToken>  │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Server validates:                    │
│ - Token signature ✓                  │
│ - Token expiry ✓                     │
│ - User exists ✓                      │
│ - User not blocked ✓                 │
└──────────────┬───────────────────────┘
               │
               ▼
        Request Allowed ✓


When accessToken expires (after 1h):
─────────────────────────────────────
Client sends refreshToken to:
POST /api/auth/refresh (implement this later)
  ↓
Server validates refreshToken
  ↓
Issues new accessToken (1h)
  ↓
Client updates stored token
```

---

## 📊 Database State Changes

```
┌──────────────────────────────────────────────────────────┐
│            PHONE LOGIN - NEW USER                        │
└──────────────────────────────────────────────────────────┘

1. Send OTP:
   ┌─────────────────────────────────┐
   │ Otp Table                       │
   ├─────────────────────────────────┤
   │ phone: +919876543210            │
   │ otp: 123456                     │
   │ purpose: REGISTER               │
   │ isUsed: false                   │
   │ expiresAt: now + 10min          │
   └─────────────────────────────────┘

2. Verify OTP:
   ┌─────────────────────────────────┐
   │ Otp Table (updated)             │
   ├─────────────────────────────────┤
   │ isUsed: true ← Changed          │
   └─────────────────────────────────┘

3. Complete Profile:
   ┌─────────────────────────────────┐
   │ User Table (new row)            │
   ├─────────────────────────────────┤
   │ id: 1                           │
   │ phone: +919876543210            │
   │ email: john@example.com         │
   │ name: John Doe                  │
   │ passwordHash: $2a$12$...        │
   │ roleId: 2                       │
   │ isVerified: true ← Important    │
   │ status: ACTIVE                  │
   │ lastLogin: now                  │
   └─────────────────────────────────┘


┌──────────────────────────────────────────────────────────┐
│           PHONE LOGIN - EXISTING USER                    │
└──────────────────────────────────────────────────────────┘

1. Send OTP:
   ┌─────────────────────────────────┐
   │ Otp Table                       │
   ├─────────────────────────────────┤
   │ phone: +919876543210            │
   │ otp: 456789                     │
   │ purpose: LOGIN ← Different      │
   │ isUsed: false                   │
   │ expiresAt: now + 10min          │
   └─────────────────────────────────┘

2. Verify OTP:
   ┌─────────────────────────────────┐
   │ Otp Table (updated)             │
   ├─────────────────────────────────┤
   │ isUsed: true                    │
   └─────────────────────────────────┘
   
   ┌─────────────────────────────────┐
   │ User Table (updated)            │
   ├─────────────────────────────────┤
   │ lastLogin: now ← Updated        │
   │ isVerified: true ← Ensured      │
   └─────────────────────────────────┘


┌──────────────────────────────────────────────────────────┐
│                EMAIL LOGIN                               │
└──────────────────────────────────────────────────────────┘

No OTP table involved
Just:
   ┌─────────────────────────────────┐
   │ User Table (updated)            │
   ├─────────────────────────────────┤
   │ lastLogin: now ← Updated        │
   └─────────────────────────────────┘
```

---

## 🎯 Decision Tree for Frontend

```
User wants to login
        │
        ▼
  ┌─────────────┐
  │ Which way?  │
  └──────┬──────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼─────┐
│Phone │  │ Email  │
└───┬──┘  └──┬─────┘
    │         │
    │         ▼
    │    Has email & password?
    │         │
    │    ┌────┴────┐
    │    │         │
    │   Yes       No
    │    │         │
    │    ▼         ▼
    │   Use     Force
    │  Email    Phone
    │  Flow     Flow
    │    │         │
    │    └────┬────┘
    │         │
    ▼         ▼
Phone Flow  Email Flow
    │         │
    ▼         ▼
Send OTP   Validate
    │       Password
    ▼           │
Enter OTP       │
    │           │
    ▼           │
Verify OTP      │
    │           │
    ▼           │
Existing?       │
    │           │
┌───┴───┐       │
│       │       │
Yes    No       │
│       │       │
│       ▼       │
│   Complete    │
│   Profile     │
│       │       │
└───┬───┴───────┘
    │
    ▼
 Login ✓
```

---

## 🚀 Production Deployment Flow

```
┌──────────────────────────────────────────────────────────┐
│              DEVELOPMENT                                 │
└──────────────────────────────────────────────────────────┘

NODE_ENV=development
        │
        ▼
┌──────────────────────────┐
│ OTP sent?                │
│ → Logged to console      │
│ → No SMS actually sent   │
└──────────┬───────────────┘
           │
           ▼
    Check terminal:
    ━━━━━━━━━━━━━━━━━━━━
    📱 OTP: 123456
    ━━━━━━━━━━━━━━━━━━━━


┌──────────────────────────────────────────────────────────┐
│              PRODUCTION                                  │
└──────────────────────────────────────────────────────────┘

NODE_ENV=production
        │
        ▼
┌────────────────────────────┐
│ SMS Provider configured?   │
└──────┬────────────────────┘
       │
  ┌────┴────┐
  │         │
 Yes       No
  │         │
  ▼         ▼
Use      Error:
SMS      "SMS not
Provider  configured"
  │
  ▼
┌─────────────────────────┐
│ MSG91 / Fast2SMS /      │
│ Twilio API call         │
└──────┬──────────────────┘
       │
       ▼
  SMS sent to
  user's phone ✓
```

---

## 📱 Mobile App Integration

```
┌──────────────────────────────────────────────────────────┐
│           REACT NATIVE / FLUTTER APP                     │
└──────────────────────────────────────────────────────────┘

1. Login Screen Component
   ┌─────────────────────────────┐
   │ [Phone Tab] [Email Tab]     │
   └─────────────────────────────┘
           │
   ┌───────┴────────┐
   │                │
   ▼                ▼
Phone Input      Email Input
   │              Password Input
   ▼                │
[Send OTP]          │
   │                ▼
   │          [Login Button]
   │                │
   ▼                │
2. OTP Screen       │
   ┌─────────────┐  │
   │ Enter 6     │  │
   │ digits      │  │
   │ [Verify]    │  │
   │ [Resend]    │  │
   └──────┬──────┘  │
          │         │
          ▼         │
Response: userExists?
    │         │
   Yes        No
    │         │
    │         ▼
    │    3. Profile Screen
    │       ┌─────────────┐
    │       │ Enter Name  │
    │       │ Email (opt) │
    │       │ Pass (opt)  │
    │       │ [Complete]  │
    │       └──────┬──────┘
    │              │
    └──────────────┘
           │
           ▼
4. Save Tokens
   ┌─────────────────────────┐
   │ SecureStorage:          │
   │ - accessToken           │
   │ - refreshToken          │
   └──────┬──────────────────┘
          │
          ▼
5. Navigate to Home ✓


API Calls from Mobile:
━━━━━━━━━━━━━━━━━━━━━━
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.doorly.com'
})

// Send OTP
await api.post('/api/auth/send-otp', {
  phone: '+919876543210'
})

// Verify OTP
const { data } = await api.post('/api/auth/verify-otp', {
  phone: '+919876543210',
  otp: '123456'
})

// Save tokens
await SecureStore.setItemAsync('accessToken', data.data.accessToken)

// Use token in requests
api.defaults.headers.common['Authorization'] = 
  `Bearer ${accessToken}`
```

---

**These visual flows make it easy to understand the entire auth system at a glance!** 🎨

