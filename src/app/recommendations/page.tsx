'use client';

import React, { useState, useMemo } from 'react';
import {
    TrendingUp,
    Target,
    Zap,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Plus,
    DollarSign,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';
import {
    SUBSCRIPTION_PLANS,
    type SubscriptionTier,
} from '@/lib/types';

// ============================================
// Types & Logic
// ============================================

interface Recommendation {
    id: string;
    title: string;
    type: 'upgrade' | 'optimization' | 'pack';
    description: string;
    pros: string[];
    cons: string[];
    monthlySavings: number;
    annualSavings: number;
    costPerCredit: number;
    totalMonthlyCost: number;
    isRecommended: boolean;
    actionLabel: string;
    actionUrl?: string;
}

function generateRecommendations(currentTier: SubscriptionTier, usage: number, growth: number): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 1. Upgrade Recommendation
    if (currentTier === 'free' && usage > 100) {
        recommendations.push({
            id: 'upgrade-standard',
            title: 'Upgrade to Standard',
            type: 'upgrade',
            description: 'Your usage exceeds the Free tier allowance. Standard offers better cost efficiency for your volume.',
            pros: ['Predictable daily allowance', 'Monthly bonus credits', 'Access to Modeller'],
            cons: ['Monthly subscription cost'],
            monthlySavings: 15.50,
            annualSavings: 186.00,
            costPerCredit: 0.045,
            totalMonthlyCost: 9.99,
            isRecommended: true,
            actionLabel: 'Upgrade Now',
            actionUrl: '/pricing',
        });
    } else if (currentTier === 'standard' && usage > 400) {
         recommendations.push({
            id: 'upgrade-pro',
            title: 'Scale to Pro',
            type: 'upgrade',
            description: 'You are hitting the limits of the Standard tier. Pro provides the lowest per-token cost for heavy users.',
            pros: ['Max daily allowance', 'Priority processing', 'Deep Research included'],
            cons: ['Higher monthly commitment'],
            monthlySavings: 42.00,
            annualSavings: 504.00,
            costPerCredit: 0.028,
            totalMonthlyCost: 29.99,
            isRecommended: true,
            actionLabel: 'Get Pro Access',
            actionUrl: '/pricing',
        });
    }

    // 2. Optimization: Pack Strategy
    if (growth > 15) {
        recommendations.push({
            id: 'strategy-packs',
            title: 'Quarterly Pack Strategy',
            type: 'pack',
            description: 'With high growth, buying credits in bulk quarterly can save up to 15% compared to just-in-time purchases.',
            pros: ['Lock in lower rates', 'Growth protection'],
            cons: ['Higher upfront payment'],
            monthlySavings: 8.20,
            annualSavings: 98.40,
            costPerCredit: 0.039,
            totalMonthlyCost: 19.99,
            isRecommended: false,
            actionLabel: 'View Packs',
            actionUrl: '/pricing',
        });
    }

    return recommendations;
}

// ============================================
// Recommendation Card
// ============================================

function RecommendationCard({ rec }: { rec: Recommendation }) {
    const color = rec.isRecommended ? 'var(--primary-light)' : 'var(--foreground-muted)';
    const bgColor = rec.isRecommended ? 'var(--primary-light-alpha-10)' : 'var(--background-tertiary)';

    return (
        <div className="glass rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
            {rec.isRecommended && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
            )}
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/40 group-hover:text-teal-400 transition-colors">
                            {rec.type === 'upgrade' ? <Zap size={20} /> : <Target size={20} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{rec.title}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{rec.type}</p>
                        </div>
                    </div>
                    
                    <p className="text-xs text-white/40 leading-relaxed mb-6">{rec.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">Pros</h4>
                            <ul className="space-y-2">
                                {rec.pros.map(p => (
                                    <li key={p} className="flex items-center gap-2 text-[10px] font-bold text-white/60">
                                        <CheckCircle2 size={12} className="text-emerald-500" /> {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-2">Cons</h4>
                            <ul className="space-y-2">
                                {rec.cons.map(c => (
                                    <li key={c} className="flex items-center gap-2 text-[10px] font-bold text-white/40">
                                        <AlertCircle size={12} className="text-rose-500/50" /> {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="w-full md:w-64 bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Projected Savings</div>
                            <div className="text-2xl font-black font-mono text-emerald-400">${rec.monthlySavings.toFixed(2)}<span className="text-xs text-emerald-400/50">/mo</span></div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/30">~${rec.annualSavings.toFixed(0)} / yr</div>
                        </div>
                        
                        <div className="pt-4 border-t border-white/5 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-white/30 uppercase">Total Cost</span>
                                <span className="text-white/60">${rec.totalMonthlyCost.toFixed(2)}/mo</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-white/30 uppercase">Per Credit</span>
                                <span className="text-white/60">${rec.costPerCredit.toFixed(3)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        {rec.actionUrl && (
                            <a href={rec.actionUrl} className="btn-primary w-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                {rec.actionLabel} <ArrowRight size={14} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Page
// ============================================

export default function RecommendationsPage() {
    const { profile, loading } = useAuth();
    const currentTier = (profile?.subscription || 'free') as SubscriptionTier;

    const [tier, setTier] = useState<SubscriptionTier>(currentTier);
    const [usage, setUsage] = useState(350);
    const [growth, setGrowth] = useState(8);

    // Update tier if profile changes
    React.useEffect(() => {
        if (profile?.subscription) setTier(profile.subscription);
    }, [profile?.subscription]);

    const recs = useMemo(() => generateRecommendations(tier, usage, growth), [tier, usage, growth]);

    if (loading) {
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
                <header className="glass-strong border-b border-white/5 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                                <Target size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight uppercase">Smart <span className="text-teal-400">Recommendations</span></h1>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] -mt-1">Optimization Engine</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-6 py-12 w-full">
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <div className="glass p-6 rounded-3xl border border-white/5">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 block mb-3">Target Monthly Usage</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" min="0" max="2000" step="50" 
                                    value={usage} onChange={(e) => setUsage(Number(e.target.value))}
                                    className="flex-1 accent-teal-500"
                                />
                                <span className="text-xs font-mono font-bold text-teal-400">{usage}</span>
                            </div>
                        </div>
                        <div className="glass p-6 rounded-3xl border border-white/5">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 block mb-3">Projected Growth %</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" min="0" max="100" step="1" 
                                    value={growth} onChange={(e) => setGrowth(Number(e.target.value))}
                                    className="flex-1 accent-emerald-500"
                                />
                                <span className="text-xs font-mono font-bold text-emerald-400">{growth}%</span>
                            </div>
                        </div>
                        <div className="glass p-6 rounded-3xl border border-white/5">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 block mb-3">Current Active Tier</label>
                            <div className="text-sm font-bold uppercase tracking-widest text-white/60">
                                {SUBSCRIPTION_PLANS[tier].name}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {recs.length > 0 ? (
                            recs.map(rec => (
                                <RecommendationCard key={rec.id} rec={rec} />
                            ))
                        ) : (
                            <div className="text-center py-24 bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem]">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-white/20">
                                    <Sparkles size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Maximum Efficiency Detected</h3>
                                <p className="text-xs text-white/40">Your current plan and strategy are perfectly balanced for your usage profile.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
