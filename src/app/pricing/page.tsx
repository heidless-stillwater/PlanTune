'use client';

import React, { useState } from 'react';
import { 
    Check, 
    Zap, 
    CreditCard, 
    Shield, 
    ArrowRight,
    Info,
    ChevronDown,
    ChevronUp,
    Star
} from 'lucide-react';
import { 
    SUBSCRIPTION_PLANS, 
    CREDIT_PACKS, 
    type SubscriptionTier 
} from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';

export default function PricingPage() {
    const { profile, user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const [showPacks, setShowPacks] = useState(true);

    const handleCheckout = async (planId?: string, packId?: string) => {
        if (!user) {
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

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#08080c] text-white">
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-y-auto">
                <main className="max-w-7xl mx-auto px-6 py-12 w-full">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                            <Star size={14} className="fill-teal-400/20" /> Sovereign Pricing Model
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Scale Your <span className="text-teal-400">Strategy</span></h1>
                        <p className="text-white/40 text-sm font-medium leading-relaxed max-w-2xl mx-auto">
                            Predictable credit pricing for high-scale AI operations. One subscription, unified access across the Stillwater Suite.
                        </p>
                    </div>

                    {/* Subscriptions */}
                    <div className="grid md:grid-cols-3 gap-8 mb-20">
                        {(['free', 'standard', 'pro'] as SubscriptionTier[]).map((tierId) => {
                            const plan = SUBSCRIPTION_PLANS[tierId];
                            const isCurrent = currentTier === tierId;
                            const isPro = tierId === 'pro';

                            return (
                                <div key={tierId} className={`glass relative flex flex-col p-8 rounded-[2rem] border transition-all ${isPro ? 'border-teal-500/50 shadow-[0_0_50px_rgba(20,184,166,0.1)] bg-teal-500/[0.02]' : 'border-white/5 bg-white/[0.01]'}`}>
                                    {isPro && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg shadow-teal-500/30">
                                            <Zap size={12} fill="white" /> Most Efficient
                                        </div>
                                    )}
                                    
                                    <div className="mb-8">
                                        <h3 className="text-lg font-black uppercase tracking-tight text-white/40 mb-1">{plan.name}</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black">${(plan.price / 100).toFixed(2)}</span>
                                            <span className="text-white/20 text-xs font-bold">/mo</span>
                                        </div>
                                        <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-teal-400">
                                                {plan.dailyAllowance} Daily + {plan.creditsPerMonth} Bonus
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8 flex-1">
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-start gap-3 text-[11px] font-bold text-white/50">
                                                <div className="mt-0.5 w-4 h-4 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0 border border-teal-500/20">
                                                    <Check size={10} className="text-teal-400" />
                                                </div>
                                                <span className="leading-relaxed">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => !isCurrent && handleCheckout(tierId)}
                                        disabled={isCurrent || loading === tierId}
                                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${
                                            isCurrent 
                                                ? 'bg-white/5 text-white/20 cursor-default border border-white/5'
                                                : isPro
                                                    ? 'btn-primary shadow-lg shadow-teal-500/20'
                                                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                                        }`}
                                    >
                                        {loading === tierId ? 'Processing...' : isCurrent ? 'Active Plan' : 'Select Plan'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Credit Packs Section Toggle */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/10">
                                <CreditCard size={24} className="text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Credit <span className="text-amber-400">Packs</span></h2>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-0.5">Top-ups with no expiry</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowPacks(!showPacks)}
                            className="text-white/20 hover:text-white transition-colors"
                        >
                            {showPacks ? <ChevronUp /> : <ChevronDown />}
                        </button>
                    </div>

                    {showPacks && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in mb-20">
                            {CREDIT_PACKS.map((pack) => (
                                <div key={pack.id} className="glass p-6 rounded-3xl border border-white/5 flex flex-col hover:border-amber-500/20 transition-all group">
                                    <div className="text-3xl font-black text-white mb-1 group-hover:text-amber-400 transition-colors">{pack.credits.toLocaleString()}</div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-6">Total Pack Credits</div>
                                    
                                    <div className="mt-auto">
                                        <div className="text-xl font-black mb-1 text-white/80">${(pack.price / 100).toFixed(2)}</div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-6 flex items-center gap-1">
                                            <Info size={10} />
                                            ${(pack.price / 100 / pack.credits).toFixed(3)} / unit
                                        </div>
                                        
                                        <button
                                            onClick={() => handleCheckout(undefined, pack.id)}
                                            disabled={!!loading}
                                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 transition-all"
                                        >
                                            {loading === pack.id ? '...' : 'Buy Pack'}
                                            <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* FAQ / Info */}
                    <div className="glass rounded-[2rem] p-8 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-teal-400/5">
                            <Shield size={120} />
                        </div>
                        <div className="flex items-center gap-3 mb-4 text-teal-400">
                            <Shield size={20} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sovereign Billing Security</span>
                        </div>
                        <p className="text-xs text-white/30 font-medium leading-relaxed max-w-3xl">
                            PlanTune utilizes Stripe for enterprise-grade transaction security. Subscriptions are anchored to your Sovereign Identity and propagate instantly across the entire suite. Credit packs serve as a secondary resource layer, active only when daily allowances are exhausted.
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
