import axios from 'axios';
import crypto from 'crypto';

/**
 * Tango Card RaaS API v2 Service integration
 */

// Popular Brand UTIDs mapping (Tango Card Catalog Item Codes)
const BRAND_UTID_MAP = {
    'Fashion Nova': 'U715421',
    'Starbucks':    'U123456',
    'Airbnb':       'U345678',
    'Uber':         'U987654',
    'Target':       'U556677'
};

const BRAND_REDEEM_URLS = {
    'Fashion Nova': 'https://www.fashionnova.com/pages/gift-cards',
    'Starbucks':    'https://www.starbucks.com/card',
    'Airbnb':       'https://www.airbnb.com/gift',
    'Uber':         'https://www.uber.com/redeem',
    'Target':       'https://www.target.com/guest/gift-card'
};

/**
 * Programmatically orders a brand gift card.
 * Integrates with Tango Card Sandbox, falling back gracefully to Mock Mode if keys are not present.
 */
export const orderBrandGiftCard = async ({ brandName, amount, recipientEmail, recipientName }) => {
    const apiKey = process.env.TANGO_CARD_API_KEY;
    const platformName = process.env.TANGO_CARD_PLATFORM_NAME;
    const platformKey = process.env.TANGO_CARD_PLATFORM_KEY;
    const accountId = process.env.TANGO_CARD_ACCOUNT_IDENTIFIER;
    const customerId = process.env.TANGO_CARD_CUSTOMER_IDENTIFIER;

    const useMock = !apiKey && (!platformName || !platformKey);
    const utid = BRAND_UTID_MAP[brandName] || 'U-GENERAL';
    const redeemUrl = BRAND_REDEEM_URLS[brandName] || 'https://www.datespark.co';

    if (useMock) {
        console.log(`[Tango Card Service] Mock Mode Active: Simulating purchase of ${brandName} ($${amount}) for ${recipientEmail}`);
        
        // Generate realistic mock credentials
        const prefix = brandName.split(' ')[0].toUpperCase();
        const claimCode = `MOCK-${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const claimPin = String(Math.floor(1000 + Math.random() * 9000));
        
        return {
            status: 'success',
            externalRefID: `mock-order-${crypto.randomBytes(6).toString('hex')}`,
            claimCode,
            claimPin,
            claimUrl: redeemUrl
        };
    }

    try {
        console.log(`[Tango Card Service] Ordering live gift card from Tango Card Integration Sandbox: ${brandName} ($${amount})`);
        
        // Build Basic Auth header using Platform Name and Key (or API Key if single token)
        const authString = Buffer.from(`${platformName}:${platformKey || apiKey}`).toString('base64');
        
        const response = await axios.post(
            'https://integration-api.tangocard.com/raas/v2/orders',
            {
                accountIdentifier: accountId || 'datespark_account',
                amount: parseFloat(amount),
                campaign: 'datespark_gifts',
                customerIdentifier: customerId || 'datespark_customer',
                externalRefID: `ds-order-${crypto.randomBytes(6).toString('hex')}`,
                recipient: {
                    email: recipientEmail,
                    firstName: recipientName?.split(' ')[0] || 'DateSpark',
                    lastName: recipientName?.split(' ')[1] || 'Partner'
                },
                sendEmail: false, // We deliver it inside DateSpark UI / custom email
                utid: utid
            },
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const orderData = response.data;
        console.log('[Tango Card Service] Purchase successful! Order ID:', orderData.id);

        // Extract credentials from Tango Card response structure
        return {
            status: 'success',
            externalRefID: orderData.id,
            claimCode: orderData.reward?.credentials?.['Redemption Code'] || orderData.reward?.credentials?.['Claim Code'] || '',
            claimPin: orderData.reward?.credentials?.['PIN'] || '',
            claimUrl: orderData.reward?.redemptionInstructions || redeemUrl
        };
    } catch (err) {
        console.error('[Tango Card Service] Error ordering gift card:', err.response?.data || err.message);
        throw new Error(`Tango Card API Fulfillment failed: ${err.message}`);
    }
};
