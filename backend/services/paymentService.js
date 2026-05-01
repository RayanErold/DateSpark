import Stripe from 'stripe';

/**
 * PaymentService — Secure handling of financial transactions.
 * Essential to keep this unique and isolated for PCI compliance and security auditing.
 */

let stripe;

export const initPaymentService = (apiKey) => {
    stripe = new Stripe(apiKey);
};

export const createCheckoutSession = async (params) => {
    const { userId, priceId, customerEmail, successUrl, cancelUrl } = params;
    
    return await stripe.checkout.sessions.create({
        customer_email: customerEmail,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId }
    });
};

export const handleWebhook = async (body, signature, secret) => {
    // Webhook validation logic...
    return stripe.webhooks.constructEvent(body, signature, secret);
};
