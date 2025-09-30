# Forgot Password Setup Guide

## Backend Setup

### 1. Environment Variables
Add these variables to your `.env` file:

```env
# Email Configuration (for forgot password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

### 2. Gmail Setup (if using Gmail)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASS` in your .env file

### 3. Other Email Services
You can use other email services by modifying the transporter configuration in `backend/controller/auth.controller.js`:

```javascript
const transporter = nodemailer.createTransporter({
  service: 'outlook', // or 'yahoo', 'hotmail', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Frontend Setup

### 1. Routes
The forgot password route is already configured:
- `/forgot-password` - Forgot password form
- `/forgot-password?token=xxx&type=admin` - Reset password form

### 2. User Types Supported
- `admin` - Admin users
- `manager` - Manager users  
- `employee` - Employee users

## Features Implemented

### 1. Forgot Password Flow
1. User enters email address
2. System sends reset email with secure token
3. User clicks link in email
4. User sets new password
5. User can login with new password

### 2. Security Features
- Reset tokens expire in 1 hour
- Tokens are cryptographically secure (32 bytes)
- Passwords are hashed with bcrypt
- Email validation
- Password confirmation

### 3. Email Template
- Professional HTML email template
- Company branding support
- Clear instructions
- Security warnings

## API Endpoints

### POST /api/auth/forgot-password
Send password reset email
```json
{
  "email": "user@example.com",
  "userType": "admin"
}
```

### POST /api/auth/reset-password
Reset password with token
```json
{
  "token": "reset-token",
  "newPassword": "newpassword",
  "userType": "admin"
}
```

### GET /api/auth/verify-reset-token
Verify reset token validity
```
/api/auth/verify-reset-token?token=xxx&type=admin
```

## Database Changes

The following fields have been added to all user models:
- `resetPasswordToken` - String (temporary reset token)
- `resetPasswordExpiry` - Date (token expiration time)

## Testing

1. Start the backend server
2. Navigate to `/forgot-password`
3. Enter a valid email address
4. Check your email for the reset link
5. Click the link and set a new password
6. Try logging in with the new password
