import {
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { CreditTransaction, TransactionType } from '../types';

const USAGE_SUBCOLLECTION = 'transactions';

/**
 * Record a credit usage event.
 */
export async function recordUsage(
    uid: string,
    amount: number,
    type: TransactionType,
    description: string,
    metadata?: Record<string, any>
): Promise<string> {
    const txRef = collection(db, 'users', uid, USAGE_SUBCOLLECTION);
    const docRef = await addDoc(txRef, {
        type,
        amount,
        description,
        metadata: metadata || {},
        createdAt: Timestamp.now(),
    } satisfies Omit<CreditTransaction, 'id'>);
    return docRef.id;
}

/**
 * Get total usage for the current billing period (calendar month).
 */
export async function getMonthlyUsage(uid: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startTimestamp = Timestamp.fromDate(startOfMonth);

    const txRef = collection(db, 'users', uid, USAGE_SUBCOLLECTION);
    const q = query(
        txRef,
        where('type', '==', 'usage'),
        where('createdAt', '>=', startTimestamp),
        orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);
    return snap.docs.reduce((total, doc) => {
        const data = doc.data();
        return total + Math.abs(data.amount || 0);
    }, 0);
}

/**
 * Get usage history for the last N months (for trend analysis).
 * Returns an array of { month, year, total } objects.
 */
export async function getUsageHistory(
    uid: string,
    months: number = 6
): Promise<{ month: number; year: number; total: number }[]> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    const startTimestamp = Timestamp.fromDate(startDate);

    const txRef = collection(db, 'users', uid, USAGE_SUBCOLLECTION);
    const q = query(
        txRef,
        where('type', '==', 'usage'),
        where('createdAt', '>=', startTimestamp),
        orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);
    const buckets: Record<string, number> = {};

    snap.docs.forEach(doc => {
        const data = doc.data();
        const date = data.createdAt?.toDate?.() || new Date();
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        buckets[key] = (buckets[key] || 0) + Math.abs(data.amount || 0);
    });

    const result: { month: number; year: number; total: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        result.push({
            month: d.getMonth() + 1,
            year: d.getFullYear(),
            total: buckets[key] || 0,
        });
    }

    return result;
}

/**
 * Get recent transactions for display.
 */
export async function getRecentTransactions(
    uid: string,
    count: number = 10
): Promise<CreditTransaction[]> {
    const txRef = collection(db, 'users', uid, USAGE_SUBCOLLECTION);
    const q = query(txRef, orderBy('createdAt', 'desc'), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditTransaction));
}
