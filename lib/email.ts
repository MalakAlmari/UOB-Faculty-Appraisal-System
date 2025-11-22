import { Resend } from 'resend'

interface PasswordResetEmailData {
  to: string
  name: string
  resetToken: string
  resetUrl: string
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  const { to, name, resetUrl } = data

  try {
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Password Reset - Faculty Appraisal System',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - Faculty Appraisal System</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                background: #2563eb;
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .button {
                display: inline-block;
                background: #2563eb;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .footer {
                background: #1f2937;
                color: #9ca3af;
                padding: 20px;
                text-align: center;
                border-radius: 0 0 10px 10px;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Dear ${name},</h2>
              <p>We received a request to reset the password for your Faculty Appraisal System account.</p>
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p><strong>This link will expire in 24 hours.</strong></p>
              
              <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p><small>For security reasons, this link will expire after 24 hours. If you need to reset your password after this time, please make a new request.</small></p>
            </div>
            <div class="footer">
              <p>Best regards,<br>Faculty Appraisal System Team</p>
            </div>
          </body>
        </html>
      `,
    })

    console.log('Password reset email sent successfully:', result.data?.id)
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}

// Check if email is configured
export const isEmailConfigured = !!process.env.RESEND_API_KEY