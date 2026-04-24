import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ResearchArticle } from '../types';

const RESEARCH_COLLECTION = 'research';

function researchRef(userId: string) {
    return collection(db, 'users', userId, RESEARCH_COLLECTION);
}

/**
 * Create a new research article.
 */
export async function createArticle(
    userId: string,
    article: Omit<ResearchArticle, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(researchRef(userId), {
        ...article,
        createdAt: now,
        updatedAt: now,
    });
    return docRef.id;
}

/**
 * Update an existing article.
 */
export async function updateArticle(
    userId: string,
    articleId: string,
    updates: Partial<Omit<ResearchArticle, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
    const docRef = doc(db, 'users', userId, RESEARCH_COLLECTION, articleId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Delete an article.
 */
export async function deleteArticle(userId: string, articleId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, RESEARCH_COLLECTION, articleId);
    await deleteDoc(docRef);
}

/**
 * Get all articles by a specific user.
 */
export async function getUserArticles(userId: string): Promise<ResearchArticle[]> {
    const q = query(
        researchRef(userId),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResearchArticle));
}

/**
 * Subscribe to real-time article updates (user's own only).
 */
export function subscribeToArticles(
    userId: string,
    callback: (articles: ResearchArticle[]) => void
): Unsubscribe {
    const q = query(
        researchRef(userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snap) => {
        const all = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as ResearchArticle));

        callback(all);
    });
}
