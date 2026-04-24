import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SUBSCRIPTION_PLANS, type PricingScenario, type SubscriptionTier } from '../types';

const SCENARIOS_COLLECTION = 'scenarios';

/**
 * Get the Firestore collection reference for scenarios.
 */
function scenariosRef(userId: string) {
    return collection(db, 'users', userId, SCENARIOS_COLLECTION);
}

/**
 * Create a new scenario in Firestore.
 * Enforces the user's tier-based scenario limit.
 */
export async function createScenario(
    scenario: Omit<PricingScenario, 'id' | 'createdAt' | 'updatedAt'>,
    currentTier: SubscriptionTier
): Promise<string> {
    // Enforce tier limit
    const existingCount = await getUserScenarioCount(scenario.userId);
    const limit = SUBSCRIPTION_PLANS[currentTier].scenarioLimit;

    if (existingCount >= limit) {
        throw new Error(
            `Scenario limit reached (${existingCount}/${limit}). Upgrade your plan to create more scenarios.`
        );
    }

    const now = Timestamp.now();
    const docRef = await addDoc(scenariosRef(scenario.userId), {
        ...scenario,
        createdAt: now,
        updatedAt: now,
    });

    return docRef.id;
}

/**
 * Update an existing scenario.
 */
export async function updateScenario(
    userId: string,
    scenarioId: string,
    updates: Partial<Omit<PricingScenario, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
    const docRef = doc(db, 'users', userId, SCENARIOS_COLLECTION, scenarioId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Delete a scenario.
 */
export async function deleteScenario(userId: string, scenarioId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, SCENARIOS_COLLECTION, scenarioId);
    await deleteDoc(docRef);
}

/**
 * Get all scenarios for a user (one-time fetch).
 */
export async function getUserScenarios(userId: string): Promise<PricingScenario[]> {
    const q = query(
        scenariosRef(userId),
        orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingScenario));
}

/**
 * Get count of scenarios for a user.
 */
export async function getUserScenarioCount(userId: string): Promise<number> {
    const q = query(scenariosRef(userId));
    const snap = await getDocs(q);
    return snap.size;
}

/**
 * Subscribe to real-time scenario updates for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToScenarios(
    userId: string,
    callback: (scenarios: PricingScenario[]) => void
): Unsubscribe {
    const q = query(
        scenariosRef(userId),
        orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snap) => {
        const scenarios = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as PricingScenario));
        callback(scenarios);
    });
}
