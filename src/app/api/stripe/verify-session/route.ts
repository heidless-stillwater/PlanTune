export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.nextUrl.searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        return NextResponse.json({
            status: session.status,
            paymentStatus: session.payment_status,
            customerEmail: session.customer_details?.email,
            metadata: session.metadata,
        });

    } catch (err: any) {
        console.error('[Stripe Verify] Error:', err);
        return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
    }
}
