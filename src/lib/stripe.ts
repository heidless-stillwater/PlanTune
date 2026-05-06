import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build';

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
    console.warn('Warning: STRIPE_SECRET_KEY is missing. Using fallback for build.');
}

export const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16' as any,
    typescript: true,
});
