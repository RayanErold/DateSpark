import crypto from 'crypto';
import * as userService from './userService.js';
import * as tangoCardService from './tangoCardService.js';

/**
 * GiftCardService — Purchase, fulfill, validate, and redeem gift cards.
 */

export const generateCode = () => {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
};

/**
 * Creates a Stripe checkout session for a gift card purchase.
 * Supports both DateSpark passes and third-party brand cards.
 */
export const purchaseGiftCard = async (stripe, { planType, giftCardType = 'datespark_pass', brandName, amount, purchaserId, recipientEmail, message, successUrl, cancelUrl }) => {
    let lineItems = [];

    if (giftCardType === 'brand') {
        if (!brandName || !amount || isNaN(amount) || amount <= 0) {
            throw new Error('Brand name and valid face value amount are required.');
        }
        lineItems = [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `${brandName} Gift Card`,
                    description: `A $${amount} Gift Card from ${brandName} powered by DateSpark`,
                },
                unit_amount: Math.round(parseFloat(amount) * 100), // in cents
            },
            quantity: 1
        }];
    } else {
        const priceMap = {
            '24H':           process.env.STRIPE_GIFT_PRICE_24H,
            'COUPLES_MONTH': process.env.STRIPE_GIFT_PRICE_COUPLES_MONTH,
            'COUPLES_YEAR':  process.env.STRIPE_GIFT_PRICE_COUPLES_YEAR,
            'ELITE':         process.env.STRIPE_GIFT_PRICE_ELITE,
        };

        const priceId = priceMap[planType];
        if (!priceId) throw new Error(`Unknown gift card plan type: ${planType}`);
        lineItems = [{ price: priceId, quantity: 1 }];
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            type: 'gift_card',
            giftCardType,
            brandName: brandName || '',
            amount: amount ? String(amount) : '',
            planType: planType || '',
            purchaserId: purchaserId || '',
            recipientEmail: recipientEmail || '',
            message: message || '',
        }
    });

    return session;
};

/**
 * Called from the Stripe webhook after a gift card payment completes.
 * Inserts the gift card row and triggers Tango Card API order if brand card.
 */
export const fulfillGiftCard = async (supabaseAdmin, emailService, stripeSession) => {
    const { giftCardType, planType, brandName, amount, purchaserId, recipientEmail, message } = stripeSession.metadata;
    const code = generateCode();

    let dbData = {
        code,
        purchaser_id: purchaserId || null,
        recipient_email: recipientEmail || null,
        message: message || null,
        status: 'active',
        stripe_session_id: stripeSession.id,
    };

    if (giftCardType === 'brand') {
        dbData.gift_card_type = 'brand';
        dbData.brand_name = brandName;
        dbData.face_value = parseFloat(amount);
        
        // Purchase card via Tango Card API or Mock
        try {
            const reward = await tangoCardService.orderBrandGiftCard({
                brandName,
                amount: parseFloat(amount),
                recipientEmail: recipientEmail
            });
            dbData.external_claim_url = reward.claimUrl;
            dbData.external_claim_code = reward.claimCode;
            dbData.external_claim_pin = reward.claimPin;
        } catch (tangoError) {
            console.error('[Gift Card Service] Tango Card API purchase failed during webhook fulfillment:', tangoError.message);
            // We still insert the gift card row but leave claim details blank for manual admin intervention
            dbData.status = 'active'; 
        }
    } else {
        dbData.gift_card_type = 'datespark_pass';
        dbData.plan_type = planType;
    }

    const { data, error } = await supabaseAdmin
        .from('gift_cards')
        .insert([dbData])
        .select()
        .single();

    if (error) throw error;

    // Send gift card email to recipient
    if (recipientEmail && emailService?.sendGiftCardEmail) {
        await emailService.sendGiftCardEmail({ 
            recipientEmail, 
            code, 
            planType: giftCardType === 'brand' ? `${brandName} $${amount}` : planType, 
            message,
            giftCardType,
            brandName,
            amount: giftCardType === 'brand' ? amount : undefined,
            claimCode: dbData.external_claim_code,
            claimPin: dbData.external_claim_pin,
            claimUrl: dbData.external_claim_url
        });
    }

    return data;
};

/**
 * Validates a gift card code — returns card info if active, throws if invalid/expired.
 */
export const validateGiftCard = async (supabase, code) => {
    const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

    if (error || !data) throw new Error('Gift card not found.');
    if (data.status === 'redeemed') throw new Error('This gift card has already been redeemed.');
    if (data.status === 'expired') throw new Error('This gift card has expired.');
    if (data.expires_at && new Date(data.expires_at) < new Date()) throw new Error('This gift card has expired.');

    return data;
};

/**
 * Redeems a gift card for a user.
 */
export const redeemGiftCard = async (supabaseAdmin, code, userId) => {
    const card = await validateGiftCard(supabaseAdmin, code);

    // Mark as redeemed
    const { error } = await supabaseAdmin
        .from('gift_cards')
        .update({
            status: 'redeemed',
            recipient_id: userId,
            redeemed_at: new Date().toISOString(),
        })
        .eq('id', card.id);

    if (error) throw error;

    // If it's a DateSpark plan, apply the plan to the user's profile
    if (card.gift_card_type !== 'brand') {
        await userService.applySubscriptionPlan(supabaseAdmin, userId, card.plan_type);
    }

    return { 
        success: true, 
        giftCardType: card.gift_card_type,
        brandName: card.brand_name,
        faceValue: card.face_value,
        claimCode: card.external_claim_code,
        claimPin: card.external_claim_pin,
        claimUrl: card.external_claim_url,
        planType: card.plan_type 
    };
};
