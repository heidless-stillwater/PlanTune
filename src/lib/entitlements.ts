import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export type AppSuiteType = 'resources' | 'studio' | 'prompttool' | 'registry' | 'plantune';

/**
 * ENTITLEMENT HELPER (PlanTune Version)
 * Checks access against the global Identity Store (database: 'prompttool-db-0').
 */
export async function checkAppAccess(uid: string, app: AppSuiteType): Promise<boolean> {
    try {
        const apps = getApps();
        const firebaseApp = apps.length > 0 ? apps[0] : null;

        if (!firebaseApp) {
            console.error('Firebase app not initialized in checkAppAccess');
            return false;
        }

        // Read from identity store (prompttool-db-0)
        const identityDb = getFirestore(firebaseApp, 'prompttool-db-0');
        const userDoc = await identityDb.collection('users').doc(uid).get();

        if (!userDoc.exists) return false;
        const data = userDoc.data();

        // 1. Admins always have access
        if (data?.role === 'admin' || data?.role === 'su') return true;

        // 2. Read activeSuites from any of the possible Firestore fields
        const subscriptionObj =
            data?.suiteSubscription ||
            data?.subscriptionMetadata ||
            (typeof data?.subscription === 'object' ? data?.subscription : null);

        const activeSuites: string[] = subscriptionObj?.activeSuites || [];

        // Direct match
        if (activeSuites.includes(app)) return true;

        // 3. Legacy SubscriptionTier fallback — pro users get plantune access
        const tier = typeof data?.subscription === 'string' ? data.subscription : null;
        if (app === 'plantune' && (tier === 'pro' || tier === 'standard')) {
            return true;
        }

        return false;
    } catch (error) {
        console.error(`Entitlement check failed for ${uid} on app ${app}:`, error);
        return false;
    }
}
