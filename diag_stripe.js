import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkPrices() {
  const priceIds = [
    'price_1PzS9n8Zo6pa5KKTAyH2E2Vb', // 24H
    'price_1PzS9n8Zo6pa5KKTicvn5Rz8'  // ELITE
  ];

  console.log('--- STRIPE DIAGNOSTIC ---');
  console.log('Secret Key (Partial):', process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '...');
  
  for (const id of priceIds) {
    try {
      const price = await stripe.prices.retrieve(id);
      console.log(`✅ [${id}] Found: ${price.nickname || price.id}, Product: ${price.product}, Unit Amount: ${price.unit_amount / 100} ${price.currency}, Type: ${price.type}`);
    } catch (err) {
      console.log(`❌ [${id}] Error: ${err.message}`);
    }
  }
}

checkPrices();
