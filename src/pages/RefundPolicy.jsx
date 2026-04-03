import React from 'react';
import LegalLayout from '../components/LegalLayout';

const RefundPolicy = () => {
    return (
        <LegalLayout title="Refund Policy" lastUpdated="April 3, 2026">
            <section className="space-y-6">
                <p>
                    We want you to have the best date night possible. If DateSpark doesn't meet your expectations, here is how we handle refunds.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">1. 24-Hour Pass Refunds</h2>
                <p>
                    Given the immediate delivery of our AI-generated plans, 24-hour passes are generally non-refundable once activated. However, if you experience a technical failure (e.g., the app fails to generate a plan for your location), we will issue a full refund upon request.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">2. Subscription Refunds</h2>
                <p>
                    For DateSpark Plus monthly subscriptions, you can cancel at any time. We offer a full refund if requested within 48 hours of your most recent billing cycle, provided you haven't used any premium generation features during that time.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">3. Requesting a Refund</h2>
                <p>
                    To request a refund, please email our support team at <strong>support@datespark.live</strong> with your account email and the reason for your request. We process all valid requests within 3-5 business days.
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4">4. Plan Issues</h2>
                <p>
                    If a venue in your generated itinerary is closed or has changed its business practices, we encourage you to use your 'Swap Spot' feature to instantly find a better alternative. We do not provide refunds for third-party venue closures, but we do provide the tools to fix them instantly!
                </p>

                <h2 className="text-2xl font-black text-navy mt-10 mb-4 text-sm uppercase tracking-widest">DateSpark Support Team</h2>
            </section>
        </LegalLayout>
    );
};

export default RefundPolicy;
