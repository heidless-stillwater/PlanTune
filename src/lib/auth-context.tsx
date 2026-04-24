'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    User,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole, SubscriptionTier, ADMIN_EMAILS, UserCredits, DAILY_ALLOWANCE } from './types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    credits: UserCredits | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    refreshCredits: () => Promise<void>;
    effectiveRole: UserRole;
    isAdmin: boolean;
    isSu: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [credits, setCredits] = useState<UserCredits | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const effectiveRole: UserRole = profile?.actingAs || profile?.role || 'member';
    const isAdmin = profile?.role === 'admin' || profile?.role === 'su';
    const isSu = profile?.role === 'su';

    const normalizeSubscription = (sub: any): SubscriptionTier => {
        if (!sub) return 'free';
        if (typeof sub === 'string') return sub as SubscriptionTier;
        if (typeof sub === 'object') {
            const keys = Object.keys(sub);
            if (keys.includes('activeSuites')) {
                const suites = sub.activeSuites || [];
                if (suites.includes('plantune') || suites.includes('prompttool-pro')) return 'pro';
                if (suites.includes('prompttool')) return 'pro';
            }
        }
        return 'free';
    };

    const createOrUpdateProfile = async (firebaseUser: User): Promise<UserProfile> => {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const existingProfile = userSnap.data() as UserProfile;
            const isAdminUser = ADMIN_EMAILS.includes(firebaseUser.email || '');

            const providerPhoto = firebaseUser.providerData.find(p => p.photoURL)?.photoURL;
            const currentPhoto = (existingProfile.photoURL && !['null', 'undefined', ''].includes(existingProfile.photoURL))
                ? existingProfile.photoURL
                : (firebaseUser.photoURL || providerPhoto);

            const updatedProfile: UserProfile = {
                ...existingProfile,
                displayName: existingProfile.displayName || firebaseUser.displayName,
                photoURL: currentPhoto || null,
                subscription: normalizeSubscription(existingProfile.subscription),
                role: existingProfile.role || (isAdminUser ? 'admin' : 'member'),
                updatedAt: Timestamp.now(),
            };

            if (!updatedProfile.username) {
                const base = firebaseUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'user';
                updatedProfile.username = `${base}_${firebaseUser.uid.substring(0, 5)}`;
            }

            await setDoc(userRef, updatedProfile, { merge: true });
            return updatedProfile;
        }

        // New user
        const isAdminUser = ADMIN_EMAILS.includes(firebaseUser.email || '');
        const base = firebaseUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'user';

        const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName,
            username: `${base}_${firebaseUser.uid.substring(0, 5)}`,
            photoURL: firebaseUser.photoURL,
            role: isAdminUser ? 'admin' : 'member',
            subscription: 'free',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        await setDoc(userRef, newProfile);
        return newProfile;
    };

    const createOrUpdateCredits = async (userId: string, subscription: SubscriptionTier): Promise<UserCredits> => {
        const creditsRef = doc(db, 'users', userId, 'data', 'credits');
        const creditsSnap = await getDoc(creditsRef);
        const now = Timestamp.now();

        if (creditsSnap.exists()) {
            const existingCredits = creditsSnap.data() as UserCredits;
            const lastReset = existingCredits.lastDailyReset?.toDate?.();
            const today = new Date();
            const isNewDay = lastReset ? lastReset.toDateString() !== today.toDateString() : true;

            if (isNewDay) {
                const updatedCredits: UserCredits = {
                    ...existingCredits,
                    dailyAllowanceUsed: 0,
                    dailyAllowance: DAILY_ALLOWANCE[subscription],
                    lastDailyReset: now,
                };
                await setDoc(creditsRef, updatedCredits);
                return updatedCredits;
            }
            return existingCredits;
        }

        // New user credits
        const newCredits: UserCredits = {
            balance: 0,
            dailyAllowance: DAILY_ALLOWANCE[subscription],
            dailyAllowanceUsed: 0,
            lastDailyReset: now,
            deepResearchUsed: 0,
            deepResearchResetDate: now,
            totalPurchased: 0,
            totalUsed: 0,
        };

        await setDoc(creditsRef, newCredits);
        return newCredits;
    };

    const refreshProfile = useCallback(async () => {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            setProfile(userSnap.data() as UserProfile);
        }
    }, [user]);

    const refreshCredits = useCallback(async () => {
        if (!user) return;
        const creditsRef = doc(db, 'users', user.uid, 'data', 'credits');
        const creditsSnap = await getDoc(creditsRef);
        if (creditsSnap.exists()) {
            setCredits(creditsSnap.data() as UserCredits);
        }
    }, [user]);

    const signInWithGoogle = async () => {
        try {
            setError(null);
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            setError(err.message);
            console.error('Sign in error:', err);
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setProfile(null);
            setCredits(null);
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message);
            console.error('Sign out error:', err);
        }
    };

    useEffect(() => {
        let unsubscribeProfile: (() => void) | null = null;
        let unsubscribeCredits: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            try {
                if (firebaseUser) {
                    console.log('[Auth] Authenticated as:', firebaseUser.uid);
                    setUser(firebaseUser);
                    
                    console.log('[Auth] Creating/Updating profile...');
                    const initialProfile = await createOrUpdateProfile(firebaseUser);
                    console.log('[Auth] Profile ready:', initialProfile.uid);

                    console.log('[Auth] Creating/Updating credits...');
                    await createOrUpdateCredits(firebaseUser.uid, initialProfile.subscription);
                    console.log('[Auth] Credits ready');

                    const userRef = doc(db, 'users', firebaseUser.uid);
                    console.log('[Auth] Setting up profile snapshot...');
                    unsubscribeProfile = onSnapshot(userRef, (doc) => {
                        if (doc.exists()) {
                            const data = doc.data() as UserProfile;
                            setProfile({
                                ...data,
                                subscription: normalizeSubscription(data.subscription),
                            });
                        }
                    }, (err) => console.error('[Auth] Profile snapshot error:', err));

                    const creditsRef = doc(db, 'users', firebaseUser.uid, 'data', 'credits');
                    console.log('[Auth] Setting up credits snapshot...');
                    unsubscribeCredits = onSnapshot(creditsRef, (doc) => {
                        if (doc.exists()) {
                            setCredits(doc.data() as UserCredits);
                        }
                    }, (err) => console.error('[Auth] Credits snapshot error:', err));
                } else {
                    console.log('[Auth] User logged out');
                    setUser(null);
                    setProfile(null);
                    setCredits(null);
                    if (unsubscribeProfile) unsubscribeProfile();
                    if (unsubscribeCredits) unsubscribeCredits();
                }
            } catch (err: any) {
                console.error('[Auth] Caught error in onAuthStateChanged:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
            if (unsubscribeCredits) unsubscribeCredits();
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user, profile, credits, loading, error,
                signInWithGoogle, signOut, refreshProfile, refreshCredits,
                effectiveRole, isAdmin, isSu,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
