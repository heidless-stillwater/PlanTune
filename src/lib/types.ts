// ============================================
// PlanTune — Shared Type Definitions
// ============================================

// Generic Timestamp type to work with both Firebase client and admin SDKs
export type FirestoreTimestamp = any;

// ============================================
// User & Authentication Types
// ============================================

export type UserRole = 'member' | 'admin' | 'su';
export type SubscriptionTier = 'free' | 'standard' | 'pro';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string | null;
    username?: string;
    photoURL: string | null;
    role: UserRole;
    actingAs?: UserRole;
    subscription: SubscriptionTier;

    // Suite Entitlements (shared across ecosystem)
    subscriptionMetadata?: {
        bundleId: string;
        activeSuites: string[];
        status: 'active' | 'past_due' | 'canceled' | 'incomplete';
        expiresAt?: any;
    };

    suiteSubscription?: {
        bundleId: string;
        activeSuites: string[];
        status: 'active' | 'past_due' | 'canceled' | 'incomplete';
        expiresAt?: any;
    };

    createdAt: FirestoreTimestamp;
    updatedAt: FirestoreTimestamp;
}

// Admin emails (shared across suite)
export const ADMIN_EMAILS = ['heidlessemail18@gmail.com', 'heidlessemail17@gmail.com'];

// ============================================
// Subscription & Stripe Types
// ============================================

export interface SubscriptionPlan {
    id: SubscriptionTier;
    name: string;
    price: number; // monthly price in cents
    features: string[];
    dailyAllowance: number;
    creditsPerMonth: number;
    scenarioLimit: number; // PlanTune-specific
    deepResearchQuota: number; // monthly deep research queries
    stripePriceId?: string;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        features: [
            'Dashboard & basic tracking',
            '1 active scenario',
            'Basic recommendations',
            'Read published research',
            'Google free-tier sync',
        ],
        dailyAllowance: 5,
        creditsPerMonth: 0,
        scenarioLimit: 1,
        deepResearchQuota: 0,
    },
    standard: {
        id: 'standard',
        name: 'Standard',
        price: 999, // $9.99
        features: [
            'Up to 5 scenarios',
            'Advanced projections (12+ months)',
            'Create & publish research',
            'Interactive tuner',
            'Export (PDF / CSV)',
            '3 deep research queries/month',
        ],
        dailyAllowance: 15,
        creditsPerMonth: 100,
        scenarioLimit: 5,
        deepResearchQuota: 3,
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD,
    },
    pro: {
        id: 'pro',
        name: 'Professional',
        price: 2999, // $29.99
        features: [
            'Unlimited scenarios',
            'All projection horizons',
            'Deep Research (unlimited)',
            'Arbitrage alerts',
            'Interactive tuner',
            'Export (PDF / CSV)',
            'Priority support',
        ],
        dailyAllowance: 50,
        creditsPerMonth: 500,
        scenarioLimit: Infinity,
        deepResearchQuota: Infinity,
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    },
};

// ============================================
// Credit System Types
// ============================================

export type TransactionType = 'purchase' | 'usage' | 'daily_allowance' | 'refund' | 'subscription' | 'deep_research';

export interface CreditTransaction {
    id: string;
    type: TransactionType;
    amount: number;
    description: string;
    metadata?: Record<string, any>;
    createdAt: FirestoreTimestamp;
}

export interface UserCredits {
    balance: number;
    dailyAllowance: number;
    dailyAllowanceUsed: number;
    lastDailyReset: FirestoreTimestamp;
    deepResearchUsed: number;
    deepResearchResetDate: FirestoreTimestamp;
    totalPurchased: number;
    totalUsed: number;
}

export const DAILY_ALLOWANCE: Record<SubscriptionTier, number> = {
    free: 5,
    standard: 15,
    pro: 50,
};

// ============================================
// Credit Pack Types
// ============================================

export interface CreditPack {
    id: string;
    name: string;
    credits: number;
    price: number; // in cents
    stripePriceId?: string;
    isActive: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
    { id: 'starter', name: 'Starter Pack', credits: 100, price: 499, isActive: true },
    { id: 'growth', name: 'Growth Pack', credits: 500, price: 1999, isActive: true },
    { id: 'power', name: 'Power Pack', credits: 1000, price: 3499, isActive: true },
    { id: 'enterprise', name: 'Enterprise Pack', credits: 5000, price: 14999, isActive: true },
];

// ============================================
// Pricing Scenario Types
// ============================================

export interface PricingScenario {
    id: string;
    userId: string;
    name: string;
    useCase: string;
    tier: SubscriptionTier;
    monthlyUsage: number;
    growthRate: number; // monthly growth % (0-100)
    creditPackStrategy: 'none' | 'as-needed' | 'bulk-quarterly' | 'custom';
    customPacks: { packId: string; frequency: 'monthly' | 'quarterly' | 'yearly' }[];
    isPublic: boolean;
    createdAt: FirestoreTimestamp;
    updatedAt: FirestoreTimestamp;
}

export interface ProjectionResult {
    month: number;
    totalCost: number;
    creditBalance: number;
    creditsConsumed: number;
    costPerCredit: number;
    wastedCredits: number;
    savingsVsAlternative: number;
}

// ============================================
// Provider Types (for Arbitrage)
// ============================================

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'midjourney' | 'stability';

export interface ProviderPricing {
    id: string;
    provider: AIProvider;
    providerName: string;
    models: ModelPricing[];
    lastUpdated: FirestoreTimestamp;
}

export interface ModelPricing {
    modelName: string;
    inputPricePerToken: number;
    outputPricePerToken: number;
    imagePricePerUnit?: number;
    currency: string;
    tier?: string;
    notes?: string;
}

// ============================================
// Research Types
// ============================================

export interface ResearchArticle {
    id: string;
    userId: string;
    title: string;
    content: string;
    summary: string;
    sources: { url: string; title: string; fetchedAt: FirestoreTimestamp }[];
    tags: string[];
    visibility: 'private' | 'published';
    version: number;
    createdAt: FirestoreTimestamp;
    updatedAt: FirestoreTimestamp;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
