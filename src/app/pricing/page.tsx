'use client';

import { useState } from 'react';
import { 
    Check, 
    Zap, 
    CreditCard, 
    Shield, 
    ArrowRight,
    Info,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { 
    SUBSCRIPTION_PLANS, 
    CREDIT_PACKS, 
    type SubscriptionTier 
} from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function PricingPage() {
    const { profile, user } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const [showPacks, setShowPacks] = useState(true);

    const handleCheckout = async (planId?: string, packId?: string) => {
        if (!user) {
            // Handle sign-in redirect or popup
            return;
        }

        setLoading(planId || packId || 'loading');
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planId, packId })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('Checkout error:', data.error);
            }
        } catch (err) {
            console.error('Failed to initiate checkout:', err);
        } finally {
            setLoading(null);
        }
    };

    const currentTier = profile?.subscription || 'free';

    return (
        <div className="min-h-screen bg-[var(--background)] py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4">Choose Your <span className="gradient-text">Growth Strategy</span></h1>
                    <p className="text-[var(--foreground-muted)] text-lg max-w-2xl mx-auto">
                        Scale your AI operations with predictable credit pricing. Upgrade for deeper insights and higher allowances.
                    </p>
                </div>

                {/* Subscriptions */}
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {(['free', 'standard', 'pro'] as SubscriptionTier[]).map((tierId) => {
                        const plan = SUBSCRIPTION_PLANS[tierId];
                        const isCurrent = currentTier === tierId;
                        const isPro = tierId === 'pro';

                        return (
                            <div key={tierId} className={`metric-card relative flex flex-col ${isPro ? 'border-[var(--primary-light)] glow-teal' : ''}`}>
                                {isPro && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                        <Zap size={12} fill="white" /> RECOMMENDED
                                    </div>
                                )}
                                
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">${(plan.price / 100).toFixed(2)}</span>
                                        <span className="text-[var(--foreground-muted)] text-sm">/mo</span>
                                    </div>
                                    <p className="text-sm text-[var(--foreground-muted)] mt-2">
                                        {plan.dailyAllowance} daily + {plan.creditsPerMonth} monthly bonus
                                    </p>
                                </div>

                                <div className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3 text-sm">
                                            <div className="mt-0.5 w-4 h-4 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
                                                <Check size={10} className="text-[var(--primary-light)]" />
                                            </div>
                                            <span className="text-[var(--foreground-muted)]">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => !isCurrent && handleCheckout(tierId)}
                                    disabled={isCurrent || loading === tierId}
                                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                                        isCurrent 
                                            ? 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] cursor-default'
                                            : isPro
                                                ? 'btn-primary'
                                                : 'btn-secondary'
                                    }`}
                                >
                                    {loading === tierId ? 'Processing...' : isCurrent ? 'Current Plan' : 'Upgrade Now'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Credit Packs Section Toggle */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                            <CreditCard size={20} className="text-[var(--primary-light)]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Supplemental Credit Packs</h2>
                            <p className="text-sm text-[var(--foreground-muted)]">One-time top-ups that never expire</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowPacks(!showPacks)}
                        className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                        {showPacks ? <ChevronUp /> : <ChevronDown />}
                    </button>
                </div>

                {showPacks && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                        {CREDIT_PACKS.map((pack) => (
                            <div key={pack.id} className="metric-card card-hover flex flex-col">
                                <div className="text-3xl font-black gradient-text mb-1">{pack.credits.toLocaleString()}</div>
                                <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider mb-4">Total Credits</div>
                                
                                <div className="mt-auto">
                                    <div className="text-xl font-bold mb-1">${(pack.price / 100).toFixed(2)}</div>
                                    <div className="text-xs text-[var(--foreground-muted)] mb-6 flex items-center gap-1">
                                        <Info size={12} />
                                        ${(pack.price / 100 / pack.credits).toFixed(3)} per credit
                                    </div>
                                    
                                    <button
                                        onClick={() => handleCheckout(undefined, pack.id)}
                                        disabled={!!loading}
                                        className="btn-secondary w-full py-2.5 text-sm flex items-center justify-center gap-2"
                                    >
                                        {loading === pack.id ? 'Processing...' : 'Purchase Pack'}
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* FAQ / Info */}
                <div className="mt-20 glass rounded-3xl p-8 border border-[var(--border-accent)]">
                    <div className="flex items-center gap-2 mb-4 text-[var(--primary-light)]">
                        <Shield size={18} />
                        <span className="font-bold">Safe & Integrated Billing</span>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                        PlanTune uses Stripe for all transactions. Your subscription is managed at the Suite level — upgrades here grant access to premium features across all integrated applications. Credit packs are specific to your account balance and are consumed only after daily allowances are exhausted.
                    </p>
                </div>
            </div>
        </div>
    );
}
