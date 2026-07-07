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

export const sendGiftCardEmail = async ({ recipientEmail, code, planType, message, giftCardType, brandName, amount, claimCode, claimPin, claimUrl }) => {
    try {
        console.log(`[EmailService] Sending gift card email to: ${recipientEmail}`);

        let cardDetailsHtml = '';
        if (giftCardType === 'brand') {
            cardDetailsHtml = `
                <div style="background: #f4f5f7; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: left;">
                    <h3 style="margin-top: 0; color: #1e293b;">Your ${brandName} Gift Card Details:</h3>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Value:</strong> $${amount}</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Gift Code:</strong> <code style="background: #fff; padding: 3px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-weight: bold;">${claimCode}</code></p>
                    ${claimPin ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Security PIN:</strong> <code style="background: #fff; padding: 3px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-weight: bold;">${claimPin}</code></p>` : ''}
                    <div style="margin-top: 15px; text-align: center;">
                        <a href="${claimUrl}" target="_blank" style="background-color: #1e293b; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
                            Redeem on ${brandName}
                        </a>
                    </div>
                </div>
            `;
        } else {
            cardDetailsHtml = `
                <div style="background: #fff5f2; border: 1px solid #ffe3db; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                    <h3 style="margin-top: 0; color: #FF6B47;">Your DateSpark Premium Activation Code:</h3>
                    <p style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #FF6B47; margin: 15px 0;">${code}</p>
                    <p style="margin: 8px 0; font-size: 13px; color: #666;"><strong>Plan Type:</strong> ${planType}</p>
                    <div style="margin-top: 20px;">
                        <a href="${process.env.VITE_APP_URL || 'https://datespark.co'}/gift" style="background-color: #FF6B47; color: white; padding: 10px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                            Redeem Plan Code
                        </a>
                    </div>
                </div>
            `;
        }

        const { data, error } = await resend.emails.send({
            from: 'DateSpark Gift <onboarding@resend.dev>',
            to: [recipientEmail],
            subject: giftCardType === 'brand' ? `🎁 You received a $${amount} ${brandName} Gift Card!` : `⚡ You received a DateSpark Premium Gift!`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #edf2f7; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span style="font-size: 40px;">🎁</span>
                        <h2 style="color: #1A1F36; margin-top: 10px;">A Special Surprise for You!</h2>
                    </div>
                    
                    ${message ? `
                        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #FF6B47; font-style: italic; color: #4a5568; margin-bottom: 20px; font-size: 14px;">
                            "${message}"
                        </div>
                    ` : ''}

                    ${cardDetailsHtml}

                    <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 25px 0;" />
                    <p style="font-size: 11px; color: #a0aec0; text-align: center; line-height: 1.5;">
                        This gift card was purchased via DateSpark. For support or queries, contact support@datespark.live.
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
