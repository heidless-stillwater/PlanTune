export const dynamic = "force-static";
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { SUBSCRIPTION_PLANS, CREDIT_PACKS, SubscriptionTier } from '@/lib/types';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;

    try {
        if (!sig || !endpointSecret) {
            console.error('[Stripe Webhook] Missing signature or secret');
            return NextResponse.json({ error: 'Webhook Secret not configured' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`[Stripe Webhook] Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any;
                const userId = session.client_reference_id;
                const metadata = session.metadata || {};

                if (!userId) {
                    console.error('[Stripe Webhook] Missing userId in session');
                    break;
                }

                // Handle credit pack purchase
                if (metadata.type === 'credit_pack') {
                    const packId = metadata.packId;
                    const pack = CREDIT_PACKS.find(p => p.id === packId);

                    if (pack) {
                        console.log(`[Stripe Webhook] Credit pack purchase: ${pack.name} for user ${userId}`);

                        // 1. Increment credit balance
                        const creditsRef = adminDb.collection('users').doc(userId).collection('data').doc('credits');
                        await creditsRef.update({
                            balance: FieldValue.increment(pack.credits),
                            totalPurchased: FieldValue.increment(pack.credits),
                        });

                        // 2. Record transaction
                        await adminDb.collection('users').doc(userId).collection('creditHistory').add({
                            type: 'purchase',
                            amount: pack.credits,
                            description: `Credit Pack: ${pack.name}`,
                            metadata: {
                                stripeSessionId: session.id,
                                packId,
                                price: pack.price,
                            },
                            createdAt: Timestamp.now(),
                        });
                    }
                    break;
                }

                // Handle subscription upgrade
                const planId = metadata.planId as SubscriptionTier;
                if (planId && SUBSCRIPTION_PLANS[planId]) {
                    const plan = SUBSCRIPTION_PLANS[planId];
                    console.log(`[Stripe Webhook] Subscription: ${plan.name} for user ${userId}`);

                    // 1. Update user profile
                    await adminDb.collection('users').doc(userId).update({
                        subscription: planId,
                        updatedAt: Timestamp.now(),
                    });

                    // 2. Grant bonus credits
                    const creditsRef = adminDb.collection('users').doc(userId).collection('data').doc('credits');
                    await creditsRef.update({
                        balance: FieldValue.increment(plan.creditsPerMonth),
                        totalPurchased: FieldValue.increment(plan.creditsPerMonth),
                        dailyAllowance: plan.dailyAllowance,
                    });

                    // 3. Record transaction
                    await adminDb.collection('users').doc(userId).collection('creditHistory').add({
                        type: 'subscription',
                        amount: plan.creditsPerMonth,
                        description: `Subscription Upgrade: ${plan.name}`,
                        metadata: { stripeSessionId: session.id, planId },
                        createdAt: Timestamp.now(),
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                const subUserId = subscription.metadata?.userId;

                if (subUserId) {
                    await adminDb.collection('users').doc(subUserId).update({
                        subscription: 'free',
                        updatedAt: Timestamp.now(),
                    });

                    const creditsRef = adminDb.collection('users').doc(subUserId).collection('data').doc('credits');
                    await creditsRef.update({
                        dailyAllowance: SUBSCRIPTION_PLANS.free.dailyAllowance,
                    });
                }
                break;
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error('[Stripe Webhook] Processing Error:', err);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}


