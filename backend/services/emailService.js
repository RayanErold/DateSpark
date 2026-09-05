import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendFeedbackEmail = async ({ userEmail, message, userId, type = 'feedback' }) => {
    try {
        const isSupport = type === 'support';
        const subjectEmoji = isSupport ? '🚨' : '✨';
        const subjectPrefix = isSupport ? 'Support Request' : 'New Feedback';
        const titleText = isSupport ? 'New Support Request! 🚨' : 'New Feedback Received! 💖';
        const accentColor = isSupport ? '#1A1F36' : '#FF6B47'; // Navy for support, Coral for feedback

        console.log(`[EmailService] Attempting to send ${type} email from: ${userEmail}`);

        const { data, error } = await resend.emails.send({
            from: `DateSpark ${isSupport ? 'Support' : 'Feedback'} <support@datespark.live>`,
            to: ['rayanerold@gmail.com'], 
            subject: `${subjectEmoji} ${subjectPrefix} from ${userEmail || 'Anonymous'}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: ${accentColor};">${titleText}</h2>
                    <p><strong>Type:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${accentColor};">${type}</span></p>
                    <p><strong>User Email:</strong> ${userEmail || 'Anonymous'}</p>
                    <p><strong>User ID:</strong> ${userId || 'N/A'}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 16px; line-height: 1.6; color: #333; background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid ${accentColor};">
                        "${message}"
                    </p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #999;">
                        Sent via DateSpark Admin System
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('[EmailService] Resend Error:', error);
            return { success: false, error };
        }

        console.log('[EmailService] Email sent successfully:', data.id);
        return { success: true, id: data.id };
    } catch (err) {
        console.error('[EmailService] Unexpected Error:', err);
        return { success: false, error: err.message };
    }
};

export const sendWelcomeEmail = async ({ userEmail, firstName }) => {
    try {
        console.log(`[EmailService] Sending welcome email to: ${userEmail}`);

        const { data, error } = await resend.emails.send({
            from: 'DateSpark <onboarding@resend.dev>',
            to: [userEmail],
            subject: `💖 Welcome to DateSpark, ${firstName}!`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
                    <h1 style="color: #FF6B47;">Welcome to the Spark! ✨</h1>
                    <p style="font-size: 18px; color: #333;">Hi ${firstName},</p>
                    <p style="font-size: 16px; line-height: 1.6; color: #555;">
                        We're so excited to have you join DateSpark. Your journey to planning perfect dates just got a whole lot easier.
                    </p>
                    <div style="margin: 30px 0;">
                        <a href="${process.env.VITE_APP_URL}/dashboard" style="background-color: #FF6B47; color: white; padding: 15px 30px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px;">
                            Start Planning Your First Date
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #999;">
                        If you have any questions, just reply to this email!
                    </p>
                </div>
            `
        });

        if (error) return { success: false, error };
        return { success: true, id: data.id };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

export const sendForgotUsernameEmail = async ({ userEmail }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'DateSpark Security <onboarding@resend.dev>',
            to: [userEmail],
            subject: 'DateSpark Account Reminder',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1A1F36;">Account Recovery 🔐</h2>
                    <p>You requested a reminder of your account details.</p>
                    <p>Your registered email address is: <strong>${userEmail}</strong></p>
                    <p style="margin-top: 20px;">
                        <a href="${process.env.VITE_APP_URL}/login" style="color: #FF6B47; font-weight: bold;">Click here to log in</a>
                    </p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #999;">
                        If you didn't request this, please ignore this email.
                    </p>
                </div>
            `
        });

        if (error) return { success: false, error };
        return { success: true, id: data.id };
    } catch (err) {
        return { success: false, error: err.message };
    }
};


