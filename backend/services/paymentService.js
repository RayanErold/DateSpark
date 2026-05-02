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
    const { userId, priceId, customerEmail, successUrl, cancelUrl, mode = 'subscription' } = params;
    
    const sessionConfig = {
        customer_email: customerEmail,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId }
    };

    // If mode is 'payment', we can add additional configurations if needed
    // but for basic one-time vs subscription, this is enough.

    return await stripe.checkout.sessions.create(sessionConfig);
};

export const createPortalSession = async (customerEmail, returnUrl) => {
    // 1. Find customer by email in Stripe
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    
    if (customers.data.length === 0) {
        throw new Error('No Stripe customer found for this email. Have you upgraded yet?');
    }
    
    const customerId = customers.data[0].id;

    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
    
    return session.url;
};

export const handleWebhook = async (body, signature, secret) => {
    // Webhook validation logic...
    return stripe.webhooks.constructEvent(body, signature, secret);
};
