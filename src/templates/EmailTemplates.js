/**
 * Premium Email Templates for DateSpark
 * Uses HSL curated colors and modern typography styles
 */

export const OTP_EMAIL_TEMPLATE = (token) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        .header { background: #ffffff; padding: 40px 40px 20px 40px; text-align: center; }
        .content { padding: 0 40px 40px 40px; }
        .logo { width: 64px; height: 64px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 10px 15px -3px rgba(244, 63, 94, 0.2); }
        h1 { color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.025em; }
        p { color: #64748b; font-size: 16px; margin-bottom: 24px; }
        .otp-container { background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px; }
        .otp-code { font-family: 'Monaco', monospace; font-size: 32px; font-weight: 800; color: #f43f5e; letter-spacing: 0.2em; }
        .footer { background: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        .highlight { color: #f43f5e; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://datespark.live/datespark-logo.png" alt="DateSpark" class="logo">
            <h1>Verify your account</h1>
        </div>
        <div class="content">
            <p>Hey there! Welcome to <span class="highlight">DateSpark</span>. Use the code below to verify your email and start planning your perfect night out.</p>
            <div class="otp-container">
                <div class="otp-code">${token}</div>
            </div>
            <p style="font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            &copy; 2026 DateSpark. Made with &hearts; for couples everywhere.
        </div>
    </div>
</body>
</html>
`;

export const WELCOME_EMAIL_TEMPLATE = (firstName) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        .hero { background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%); padding: 60px 40px; text-align: center; color: white; }
        .content { padding: 40px; }
        .footer { background: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        .btn { display: inline-block; background: #f43f5e; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; margin-top: 24px; box-shadow: 0 10px 15px -3px rgba(244, 63, 94, 0.3); }
        .feature { margin-bottom: 24px; display: flex; align-items: flex-start; gap: 16px; }
        .feature-icon { background: #fff1f2; color: #f43f5e; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
        h1 { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.05em; }
        h2 { color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 16px; }
        p { color: #64748b; font-size: 16px; margin-bottom: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>Welcome to the family, ${firstName}! 🥂</h1>
        </div>
        <div class="content">
            <h2>You're officially a DateSparker.</h2>
            <p>We're building the future of dating, and we're so glad you're here. DateSpark is designed to take the stress out of planning so you can focus on the connection.</p>
            
            <div style="margin-top: 32px;">
                <div class="feature">
                    <div class="feature-icon">1</div>
                    <div>
                        <strong style="color: #0f172a;">Plan your first date</strong>
                        <p style="font-size: 14px; margin-top: 4px;">Head to the generator and let our AI curate the perfect evening for you.</p>
                    </div>
                </div>
                <div class="feature">
                    <div class="feature-icon">2</div>
                    <div>
                        <strong style="color: #0f172a;">Exclusive "Elite" access</strong>
                        <p style="font-size: 14px; margin-top: 4px;">As a new member, you've unlocked a special 24-hour preview of our Elite venues.</p>
                    </div>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="https://datespark.live/dashboard" class="btn">Generate My First Date</a>
            </div>
        </div>
        <div class="footer">
            &copy; 2026 DateSpark. You received this because you created a DateSpark account.
        </div>
    </div>
</body>
</html>
`;
