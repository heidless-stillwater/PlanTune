import { accreditationDb } from '../firebase-admin';

export class ComplianceService {
    static async verifySovereignGate(): Promise<{
        gated: boolean;
        status?: 'red' | 'amber' | 'green';
        message?: string;
        breachedPolicySlug?: string;
    }> {
        try {
            const snap = await accreditationDb.collection('policies').get();
            const policies = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

            const breached = (policies as any[]).find(p => p.status === 'red');
            if (breached) {
                return {
                    gated: true, status: 'red',
                    message: `Sovereign Lock: Critical breach in "${breached.name}". Analytics services restricted.`,
                    breachedPolicySlug: breached.slug
                };
            }

            const drifted = (policies as any[]).find(p => p.status === 'amber');
            if (drifted) {
                return {
                    gated: false, status: 'amber',
                    message: `Compliance Warning: drift detected in "${drifted.name}".`,
                    breachedPolicySlug: drifted.slug
                };
            }

            return { gated: false, status: 'green' };
        } catch (error: any) {
            console.error('[ComplianceService] Probe Failure:', error.message);
            return { gated: true, status: 'red', message: 'Security Lock: Compliance verification failed.' };
        }
    }
}
