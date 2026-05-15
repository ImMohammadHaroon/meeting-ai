import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

function trimEnv(value) {
    return typeof value === 'string' ? value.trim() : value;
}

function normalizeAppPassword(value) {
    // Gmail app passwords are often pasted with spaces (xxxx xxxx xxxx xxxx)
    return trimEnv(value)?.replace(/\s+/g, '') || '';
}

/**
 * Create or return cached SMTP transporter.
 * Prefer port 587 (STARTTLS) — port 465 is often blocked on cloud hosts like Render.
 */
export function getTransporter() {
    if (transporter) return transporter;

    const smtpHost = trimEnv(process.env.SMTP_HOST);
    const smtpUser = trimEnv(process.env.SMTP_USER);
    const smtpPass = trimEnv(process.env.SMTP_PASS);

    if (smtpHost && smtpUser && smtpPass) {
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        transporter = nodemailer.createTransport({
            host: smtpHost,
            port,
            secure: process.env.SMTP_SECURE === 'true' || port === 465,
            auth: { user: smtpUser, pass: smtpPass },
        });
        return transporter;
    }

    const gmailUser = trimEnv(process.env.GMAIL_USER);
    const gmailPass = normalizeAppPassword(process.env.GMAIL_APP_PASSWORD);

    if (gmailUser && gmailPass) {
        const port = parseInt(process.env.GMAIL_SMTP_PORT || '587', 10);
        const secure = process.env.GMAIL_SMTP_SECURE === 'true' || port === 465;

        transporter = nodemailer.createTransport({
            host: process.env.GMAIL_SMTP_HOST || 'smtp.gmail.com',
            port,
            secure,
            auth: { user: gmailUser, pass: gmailPass },
            ...(port === 587 && !secure ? { requireTLS: true } : {}),
        });
        return transporter;
    }

    return null;
}

export function isEmailConfigured() {
    return Boolean(getTransporter());
}

/**
 * Verify SMTP connection at startup (logs result; does not throw).
 */
export async function verifyEmailService() {
    const transport = getTransporter();
    if (!transport) {
        console.warn('⚠️ Email service not configured. Set SMTP_* or GMAIL_USER + GMAIL_APP_PASSWORD.');
        return false;
    }

    try {
        await transport.verify();
        console.log('✅ Email service verified:', trimEnv(process.env.SMTP_USER) || trimEnv(process.env.GMAIL_USER));
        return true;
    } catch (error) {
        console.error('❌ Email service verification failed:', error.message);
        if (error.code === 'EAUTH') {
            console.error('   → Check Gmail App Password (no spaces) or SMTP credentials on Render.');
        }
        return false;
    }
}

export function mapEmailError(error) {
    const code = error?.code || '';
    const message = error?.message || 'Unknown error';

    if (message === 'Email service not configured') {
        return {
            status: 503,
            error: 'Email service not configured. Please contact administrator.',
        };
    }

    if (code === 'EAUTH' || /auth/i.test(message)) {
        return {
            status: 503,
            error: 'Email authentication failed. Check GMAIL_APP_PASSWORD on the server (use a Google App Password, not your regular password).',
        };
    }

    if (code === 'ETIMEDOUT' || code === 'ESOCKET' || code === 'ECONNECTION') {
        return {
            status: 503,
            error: 'Could not reach the email server. Try SMTP on port 587 or use a transactional email provider (SendGrid, Resend).',
        };
    }

    return {
        status: 500,
        error: 'Failed to send invitation',
        details: process.env.NODE_ENV === 'production' ? undefined : message,
    };
}

/**
 * Send organization invitation email
 */
export const sendInvitationEmail = async ({ to, organizationName, inviteCode, inviterName, signupUrl }) => {
    const transport = getTransporter();
    if (!transport) {
        throw new Error('Email service not configured');
    }

    const mailOptions = {
        from: trimEnv(process.env.SMTP_FROM) || trimEnv(process.env.GMAIL_USER) || 'noreply@meetingai.dev',
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
                                <tr>
                                    <td style="padding: 40px 40px 20px; text-align: center;">
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                                            Meeting AI
                                        </h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px 40px;">
                                        <p style="margin: 0 0 20px; color: #ffffff; font-size: 16px; line-height: 1.6;">
                                            Hi there!
                                        </p>
                                        <p style="margin: 0 0 20px; color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6;">
                                            <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join
                                            <strong style="color: #ffffff;">${organizationName}</strong> on Meeting AI.
                                        </p>
                                        <p style="margin: 0 0 30px; color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6;">
                                            Use this invite code to join the organization:
                                        </p>
                                        <div style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
                                            <p style="margin: 0 0 8px; color: rgba(255,255,255,0.5); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                                                Your Invite Code
                                            </p>
                                            <p style="margin: 0; font-size: 32px; font-weight: 700; font-family: monospace; letter-spacing: 4px; color: #ffffff;">
                                                ${inviteCode}
                                            </p>
                                        </div>
                                        <a href="${signupUrl}" style="display: block; background-color: #ffffff; color: #000000; text-decoration: none; font-weight: 600; font-size: 15px; padding: 16px 32px; border-radius: 12px; text-align: center;">
                                            Join Now →
                                        </a>
                                    </td>
                                </tr>
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
        `,
    };

    return transport.sendMail(mailOptions);
};

export default { sendInvitationEmail, getTransporter, verifyEmailService, isEmailConfigured };
