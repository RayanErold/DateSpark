import React from 'react';
import LegalLayout from '../components/LegalLayout';

const PrivacyPolicy = () => {
    return (
        <LegalLayout title="Privacy Policy" lastUpdated="April 3, 2026">
            <section className="space-y-6">
                <p>
                    At DateSpark, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our AI-powered date planning service.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">1. Information We Collect</h2>
                <p>
                    To provide you with the best date planning experience, we collect certain information:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Account Information:</strong> When you sign up, we collect your email address and name through Supabase Auth.</li>
                    <li><strong>Location Data:</strong> To suggest nearby date spots in New York and Jersey, we may request your current location or ask for a zip code.</li>
                    <li><strong>Preference Data:</strong> We collect information about your 'vibes' and budget preferences to tailor your AI-generated itineraries.</li>
                    <li><strong>Payment Information:</strong> All payments are processed through Stripe. We do not store your full credit card details on our servers.</li>
                </ul>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">2. How We Use Your Information</h2>
                <p>
                    We use your data strictly to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Generate personalized date itineraries using AI.</li>
                    <li>Process your One-time Pass and Subscription payments via Stripe.</li>
                    <li>Improve our venue recommendations and AI logic.</li>
                    <li>Send you important service updates via Resend email.</li>
                </ul>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">3. Data Security</h2>
                <p>
                    We use industry-standard security measures, including HTTPS encryption and secure database management through Supabase and PostgreSQL, to protect your data.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">4. Third-Party Services</h2>
                <p>
                    We partner with trusted services to deliver our product:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Stripe:</strong> For secure payment processing.</li>
                    <li><strong>Supabase:</strong> For account management and data storage.</li>
                    <li><strong>Google Maps / Yelp:</strong> To provide accurate venue information.</li>
                    <li><strong>Resend:</strong> To deliver waitlist and account emails.</li>
                </ul>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">5. Your Rights</h2>
                <p>
                    You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us at support@datespark.live.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4 text-sm uppercase tracking-widest">DateSpark Inc.</h2>
            </section>
        </LegalLayout>
    );
};

export default PrivacyPolicy;
