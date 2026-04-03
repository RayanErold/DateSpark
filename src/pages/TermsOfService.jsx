import React from 'react';
import LegalLayout from '../components/LegalLayout';

const TermsOfService = () => {
    return (
        <LegalLayout title="Terms of Service" lastUpdated="April 3, 2026">
            <section className="space-y-6">
                <p>
                    By using DateSpark, you agree to the following Terms of Service. These terms govern your access and use of our AI-powered date planning product.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">1. Use of Our AI Service</h2>
                <p>
                    DateSpark provides AI-generated itineraries based on information from public APIs (Google Maps, Yelp, etc.). While we strive for accuracy, we cannot guarantee venue availability, operating hours, or pricing as these are managed by third parties.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">2. Account Responsibility</h2>
                <p>
                    You are responsible for maintaining the confidentiality of your account and for all activities that occur under your DateSpark account. You must notify us immediately of any unauthorized use of your account.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">3. Payments and Subscriptions</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>One-time Pass (24-Hour):</strong> Provides unlimited generation and premium features for a focused period. Access expires after 24 hours from the time of purchase.</li>
                    <li><strong>DateSpark Plus (Monthly Subscription):</strong> Auto-renews every 30 days unless canceled through your account settings or Stripe customer portal.</li>
                    <li><strong>Taxes:</strong> All listed prices are exclusive of applicable taxes.</li>
                </ul>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">4. Intellectual Property</h2>
                <p>
                    All content, including our proprietary AI planning logic, brand name, logo, and design elements, is the property of DateSpark Inc. and protected by copyright law.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">5. Limitation of Liability</h2>
                <p>
                    DateSpark is not liable for any issues arising from your date experience, including issues with venue quality, transportation, or third-party bookings. We provide recommendations only; the final choice and responsibility for the date night lie with you.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">6. Modification of Terms</h2>
                <p>
                    We reserve the right to update these terms as our product grows. Continued use of DateSpark after any changes constitutes your acceptance of the new terms.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4 text-sm uppercase tracking-widest">DateSpark Inc.</h2>
            </section>
        </LegalLayout>
    );
};

export default TermsOfService;
