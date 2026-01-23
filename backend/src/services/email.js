import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter with Gmail or other SMTP
// For Gmail, you'll need to enable "Less secure apps" or use App Passwords
const createTransporter = () => {
    // Check if we have SMTP configuration
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Fallback to Gmail if GMAIL credentials are provided
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
    }

    // No email configuration - log warning
    console.warn('⚠️ Email service not configured. Set SMTP_* or GMAIL_* environment variables.');
    return null;
};

const transporter = createTransporter();

/**
 * Send organization invitation email
 */
export const sendInvitationEmail = async ({ to, organizationName, inviteCode, inviterName, signupUrl }) => {
    if (!transporter) {
        throw new Error('Email service not configured');
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@meetingai.dev',
        to,
        subject: `You're invited to join ${organizationName} on Meeting AI`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #0A0A0A; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 20px; text-align: center;">
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #ffffff 0%, #888888 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                            Meeting AI
                                        </h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 20px 40px;">
                                        <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
                                            Hi there! 👋
                                        </p>
                                        <p style="margin: 0 0 20px; color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6;">
                                            <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join 
                                            <strong style="color: #ffffff;">${organizationName}</strong> on Meeting AI.
                                        </p>
                                        <p style="margin: 0 0 30px; color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6;">
                                            Use this invite code to join the organization:
                                        </p>
                                        
                                        <!-- Invite Code Box -->
                                        <div style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
                                            <p style="margin: 0 0 8px; color: rgba(255,255,255,0.5); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                                                Your Invite Code
                                            </p>
                                            <p style="margin: 0; font-size: 32px; font-weight: 700; font-family: monospace; letter-spacing: 4px; color: #ffffff;">
                                                ${inviteCode}
                                            </p>
                                        </div>
                                        
                                        <!-- CTA Button -->
                                        <a href="${signupUrl}" style="display: block; background-color: #ffffff; color: #000000; text-decoration: none; font-weight: 600; font-size: 15px; padding: 16px 32px; border-radius: 12px; text-align: center;">
                                            Join Now →
                                        </a>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px 40px 40px; text-align: center;">
                                        <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 13px;">
                                            If you didn't expect this invitation, you can ignore this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `,
        text: `
You're invited to join ${organizationName} on Meeting AI!

${inviterName} has invited you to join their organization.

Your invite code: ${inviteCode}

Sign up here: ${signupUrl}

If you didn't expect this invitation, you can ignore this email.
        `
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
};

export default { sendInvitationEmail };
