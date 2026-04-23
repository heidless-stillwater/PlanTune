import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminAuth } from '@/lib/firebase-admin';
import { SUBSCRIPTION_PLANS, CREDIT_PACKS, SubscriptionTier } from '@/lib/types';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authentication
        const authHeader = req.headers.get('Authorization');
        let userId: string | null = null;

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decodedToken = await adminAuth.verifyIdToken(token);
            userId = decodedToken.uid;
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Request
        const { planId, packId } = await req.json();

        // Handle credit pack purchase (one-time payment)
        if (packId) {
            const pack = CREDIT_PACKS.find(p => p.id === packId);
            if (!pack || !pack.stripePriceId) {
                return NextResponse.json({ error: 'Invalid pack or price not configured' }, { status: 400 });
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{ price: pack.stripePriceId, quantity: 1 }],
                mode: 'payment',
                success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
                client_reference_id: userId,
                metadata: {
                    userId,
                    packId,
                    credits: pack.credits.toString(),
                    type: 'credit_pack',
                },
            });

            return NextResponse.json({ url: session.url });
        }

        // Handle subscription checkout
        if (planId) {
            if (!SUBSCRIPTION_PLANS[planId as SubscriptionTier]) {
                return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
            }

            const plan = SUBSCRIPTION_PLANS[planId as SubscriptionTier];
            const priceId = plan.stripePriceId;

            if (!priceId) {
                return NextResponse.json({ error: 'Stripe Price ID not configured for this plan' }, { status: 500 });
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{ price: priceId, quantity: 1 }],
                mode: 'subscription',
                success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
                client_reference_id: userId,
                metadata: { userId, planId },
                subscription_data: { metadata: { userId, planId } },
            });

            return NextResponse.json({ url: session.url });
        }

        return NextResponse.json({ error: 'Missing planId or packId' }, { status: 400 });

    } catch (err: any) {
        console.error('[Stripe Checkout] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
