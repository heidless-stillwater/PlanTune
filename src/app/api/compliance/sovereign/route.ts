import { NextResponse } from 'next/server';
import { ComplianceService } from '@/lib/services/compliance-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const status = await ComplianceService.verifySovereignGate();
        return NextResponse.json(status);
    } catch (error: any) {
        // Fail-safe in development: Allow access if sentinel is unreachable locally
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Compliance API] Sentinel unreachable in dev, allowing access.');
            return NextResponse.json({ gated: false, status: 'green' });
        }
        return NextResponse.json({
            gated: true, status: 'red',
            message: 'Compliance Sentinel unreachable.'
        }, { status: 500 });
    }
}
