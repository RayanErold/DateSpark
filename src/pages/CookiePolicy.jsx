import React from 'react';
import LegalLayout from '../components/LegalLayout';

const CookiePolicy = () => {
    return (
        <LegalLayout title="Cookie Policy" lastUpdated="April 3, 2026">
            <section className="space-y-6">
                <p>
                    DateSpark uses cookies and similar technologies to provide, protect, and improve our services. This policy explains how and why we use these technologies.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">1. What are Cookies?</h2>
                <p>
                    Cookies are small text files stored on your device that help us remember your preferences and keep you logged in. They are essential for a seamless date planning experience.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">2. Essential Cookies</h2>
                <p>
                    We use these to make our website work:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Authentication:</strong> Provided by Supabase to keep you signed in to your account.</li>
                    <li><strong>Security:</strong> To protect your data and our services from unauthorized access.</li>
                    <li><strong>Preferences:</strong> To remember your chosen 'vibes' or theme settings.</li>
                </ul>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">3. Performance Cookies</h2>
                <p>
                    These help us understand how people use DateSpark so we can make it better. We use them for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Analyzing which features are most popular.</li>
                    <li>Monitoring site speed and performance.</li>
                </ul>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">4. Managing Cookies</h2>
                <p>
                    Most browsers allow you to control cookies through their settings. However, please note that disabling essential cookies will prevent you from logging in and generating custom date plans.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">5. Questions?</h2>
                <p>
                    If you have any questions about our use of cookies, please reach out to us at <strong>support@datespark.live</strong>.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4 text-sm uppercase tracking-widest">DateSpark Inc.</h2>
            </section>
        </LegalLayout>
    );
};

export default CookiePolicy;
