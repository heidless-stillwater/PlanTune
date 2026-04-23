'use client';

import React, { useState, useMemo } from 'react';
import {
    TrendingUp, ArrowLeft, Zap, DollarSign, Target, AlertTriangle,
    CheckCircle2, ArrowRight, BarChart3, Layers, ChevronRight, Sparkles,
} from 'lucide-react';
import {
    SUBSCRIPTION_PLANS, CREDIT_PACKS, DAILY_ALLOWANCE,
    type SubscriptionTier, type CreditPack,
} from '@/lib/types';
import {
    getMonthlyCost, getTotalMonthlyCredits, getCostPerCredit,
    getWastedCredits, findBreakEvenMonth, findOptimalPack,
} from '@/lib/credit-models';

// ============================================
// Recommendation Engine
// ============================================

interface Recommendation {
    id: string;
    type: 'upgrade' | 'downgrade' | 'pack' | 'savings' | 'warning';
    title: string;
    description: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
    actionLabel?: string;
    actionHref?: string;
}

function generateRecommendations(
    currentTier: SubscriptionTier,
    monthlyUsage: number,
    growthRate: number
): Recommendation[] {
    const recs: Recommendation[] = [];
    const totalCredits = getTotalMonthlyCredits(currentTier);
    const monthlyCost = getMonthlyCost(currentTier);
    const wasted = getWastedCredits(currentTier, monthlyUsage);
    const wastePercent = totalCredits > 0 ? (wasted / totalCredits) * 100 : 0;

    // 1. Check if user is over-provisioned (waste > 40%)
    if (wastePercent > 40 && currentTier !== 'free') {
        const tiers: SubscriptionTier[] = ['free', 'standard', 'pro'];
        const currentIdx = tiers.indexOf(currentTier);
        if (currentIdx > 0) {
            const lowerTier = tiers[currentIdx - 1];
            const lowerCredits = getTotalMonthlyCredits(lowerTier);
            if (lowerCredits >= monthlyUsage) {
                const savings = monthlyCost - getMonthlyCost(lowerTier);
                recs.push({
                    id: 'downgrade',
                    type: 'downgrade',
                    title: `Consider ${SUBSCRIPTION_PLANS[lowerTier].name} tier`,
                    description: `You're wasting ${wastePercent.toFixed(0)}% of your credits. The ${SUBSCRIPTION_PLANS[lowerTier].name} tier covers your usage of ${monthlyUsage}/mo.`,
                    impact: `Save $${savings.toFixed(2)}/month ($${(savings * 12).toFixed(2)}/year)`,
                    priority: 'high',
                    actionLabel: 'Compare Plans',
                    actionHref: '/pricing',
                });
            }
        }
    }

    // 2. Check if user is under-provisioned (usage > credits)
    if (monthlyUsage > totalCredits) {
        const deficit = monthlyUsage - totalCredits;
        const tiers: SubscriptionTier[] = ['free', 'standard', 'pro'];
        const currentIdx = tiers.indexOf(currentTier);

        // Suggest upgrade
        if (currentIdx < tiers.length - 1) {
            const higherTier = tiers[currentIdx + 1];
            const higherCredits = getTotalMonthlyCredits(higherTier);
            if (higherCredits >= monthlyUsage) {
                const extraCost = getMonthlyCost(higherTier) - monthlyCost;
                recs.push({
                    id: 'upgrade',
                    type: 'upgrade',
                    title: `Upgrade to ${SUBSCRIPTION_PLANS[higherTier].name}`,
                    description: `Your usage (${monthlyUsage}/mo) exceeds your ${totalCredits} available credits. ${SUBSCRIPTION_PLANS[higherTier].name} provides ${higherCredits} credits.`,
                    impact: `+${higherCredits - totalCredits} credits for $${extraCost.toFixed(2)}/mo extra`,
                    priority: 'high',
                    actionLabel: 'View Upgrade',
                    actionHref: '/pricing',
                });
            }
        }

        // Suggest credit pack
        const pack = findOptimalPack(deficit);
        if (pack) {
            recs.push({
                id: 'pack-deficit',
                type: 'pack',
                title: `Add ${pack.name} to cover deficit`,
                description: `You need ~${deficit} more credits/month. The ${pack.name} (${pack.credits} credits) bridges the gap.`,
                impact: `$${(pack.price / 100).toFixed(2)} one-time · $${(pack.price / 100 / pack.credits).toFixed(3)}/credit`,
                priority: 'medium',
                actionLabel: 'Purchase Pack',
                actionHref: '/pricing',
            });
        }
    }

    // 3. Growth warning
    if (growthRate > 10) {
        const monthsUntilOverflow = totalCredits > monthlyUsage
            ? Math.ceil(Math.log(totalCredits / monthlyUsage) / Math.log(1 + growthRate / 100))
            : 0;

        if (monthsUntilOverflow > 0 && monthsUntilOverflow <= 6) {
            recs.push({
                id: 'growth-warning',
                type: 'warning',
                title: `Usage will exceed plan in ~${monthsUntilOverflow} months`,
                description: `At ${growthRate}% monthly growth, you'll outgrow your ${SUBSCRIPTION_PLANS[currentTier].name} plan soon. Plan ahead to avoid disruption.`,
                impact: `Projected usage: ${Math.round(monthlyUsage * Math.pow(1 + growthRate / 100, monthsUntilOverflow))} credits/mo`,
                priority: 'medium',
                actionLabel: 'Model Scenarios',
                actionHref: '/modeller',
            });
        }
    }

    // 4. Value optimization
    if (currentTier === 'free' && monthlyUsage > 100) {
        const standardCPC = getCostPerCredit('standard', monthlyUsage);
        recs.push({
            id: 'value-standard',
            type: 'savings',
            title: 'Standard tier offers better value',
            description: `At ${monthlyUsage} credits/mo, the Standard tier gives you a cost-per-credit of $${standardCPC.toFixed(3)} with 15 daily credits + 100 bonus.`,
            impact: `${getTotalMonthlyCredits('standard')} total credits for $9.99/mo`,
            priority: 'low',
            actionLabel: 'Compare',
            actionHref: '/pricing',
        });
    }

    // 5. Bulk pack savings
    if (currentTier !== 'free' && monthlyUsage > 300) {
        const bestPack = CREDIT_PACKS.reduce((best, p) =>
            (p.price / p.credits < best.price / best.credits && p.isActive) ? p : best
        , CREDIT_PACKS[0]);

        recs.push({
            id: 'bulk-savings',
            type: 'savings',
            title: `${bestPack.name} has the best value`,
            description: `At $${(bestPack.price / 100 / bestPack.credits).toFixed(3)}/credit, the ${bestPack.name} is the most cost-effective option for heavy users.`,
            impact: `${bestPack.credits} credits for $${(bestPack.price / 100).toFixed(2)}`,
            priority: 'low',
        });
    }

    // 6. Perfect fit congratulation
    if (recs.length === 0) {
        recs.push({
            id: 'optimal',
            type: 'savings',
            title: 'Your plan is optimally configured',
            description: `Your ${SUBSCRIPTION_PLANS[currentTier].name} tier covers your ${monthlyUsage} credits/mo usage with minimal waste. No changes recommended.`,
            impact: 'Keep monitoring with the Modeller as your needs evolve',
            priority: 'low',
        });
    }

    return recs.sort((a, b) => {
        const p = { high: 0, medium: 1, low: 2 };
        return p[a.priority] - p[b.priority];
    });
}

// ============================================
// Components
// ============================================

const typeIcons: Record<string, React.ElementType> = {
    upgrade: TrendingUp, downgrade: BarChart3, pack: Layers,
    savings: Sparkles, warning: AlertTriangle,
};

const typeColors: Record<string, string> = {
    upgrade: 'var(--primary)', downgrade: 'var(--info)',
    pack: 'var(--accent)', savings: 'var(--success)', warning: 'var(--warning)',
};

function RecCard({ rec }: { rec: Recommendation }) {
    const Icon = typeIcons[rec.type] || Target;
    const color = typeColors[rec.type] || 'var(--primary)';

    return (
        <div className="metric-card card-hover group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: color }} />
            <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                     style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                    <Icon size={20} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-[var(--foreground)]">{rec.title}</h3>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            rec.priority === 'high' ? 'bg-[var(--error)]/15 text-[var(--error)]' :
                            rec.priority === 'medium' ? 'bg-[var(--warning)]/15 text-[var(--warning)]' :
                            'bg-[var(--success)]/15 text-[var(--success)]'
                        }`}>
                            {rec.priority}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed mb-2">{rec.description}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold" style={{ color }}>{rec.impact}</span>
                        {rec.actionLabel && rec.actionHref && (
                            <a href={rec.actionHref}
                               className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors hover:opacity-80"
                               style={{ color }}>
                                {rec.actionLabel} <ArrowRight size={12} />
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
    const [tier, setTier] = useState<SubscriptionTier>('standard');
    const [usage, setUsage] = useState(350);
    const [growth, setGrowth] = useState(8);

    const recs = useMemo(() => generateRecommendations(tier, usage, growth), [tier, usage, growth]);

    const totalCredits = getTotalMonthlyCredits(tier);
    const utilization = totalCredits > 0 ? Math.min((usage / totalCredits) * 100, 100) : 0;

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <a href="/dashboard" className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] rounded-lg transition-all">
                        <ArrowLeft size={18} />
                    </a>
                    <div>
                        <h1 className="text-2xl font-bold">Recommendations</h1>
                        <p className="text-sm text-[var(--foreground-muted)]">AI-powered tier optimization advice</p>
                    </div>
                </div>

                {/* Input Controls */}
                <div className="glass rounded-2xl p-6 mb-8">
                    <h2 className="text-sm font-semibold mb-5 text-[var(--foreground-muted)] uppercase tracking-wider">Your Usage Profile</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Tier */}
                        <div>
                            <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 block">Current Tier</label>
                            <div className="flex gap-2">
                                {(['free', 'standard', 'pro'] as SubscriptionTier[]).map(t => (
                                    <button key={t} onClick={() => setTier(t)}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                                tier === t
                                                    ? 'bg-[var(--primary)]/15 text-[var(--primary-light)] border border-[var(--border-accent)]'
                                                    : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] border border-[var(--border)]'
                                            }`}>
                                        {SUBSCRIPTION_PLANS[t].name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Usage */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Monthly Usage</label>
                                <span className="text-sm font-mono font-bold text-[var(--primary-light)]">{usage}</span>
                            </div>
                            <input type="range" min={0} max={2000} step={10} value={usage}
                                   onChange={(e) => setUsage(Number(e.target.value))}
                                   className="w-full accent-[var(--primary)] h-2 rounded-full bg-[var(--background-tertiary)] appearance-none cursor-pointer" />
                        </div>
                        {/* Growth */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Growth Rate</label>
                                <span className="text-sm font-mono font-bold text-[var(--accent-light)]">{growth}%</span>
                            </div>
                            <input type="range" min={0} max={50} step={1} value={growth}
                                   onChange={(e) => setGrowth(Number(e.target.value))}
                                   className="w-full accent-[var(--accent)] h-2 rounded-full bg-[var(--background-tertiary)] appearance-none cursor-pointer" />
                        </div>
                    </div>

                    {/* Utilization bar */}
                    <div className="mt-6 pt-5 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[var(--foreground-muted)]">Plan Utilization</span>
                            <span className="text-xs font-mono font-bold" style={{
                                color: utilization > 90 ? 'var(--error)' : utilization > 70 ? 'var(--warning)' : 'var(--success)'
                            }}>{utilization.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--background-tertiary)] overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{
                                width: `${Math.min(utilization, 100)}%`,
                                background: utilization > 90 ? 'var(--error)' : utilization > 70 ? 'var(--warning)' : 'var(--gradient-brand)'
                            }} />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-[var(--foreground-muted)]">{usage} used</span>
                            <span className="text-[10px] text-[var(--foreground-muted)]">{totalCredits} available</span>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="flex items-center gap-2 mb-5">
                    <Target size={18} className="text-[var(--primary-light)]" />
                    <h2 className="text-lg font-semibold">{recs.length} Recommendation{recs.length !== 1 ? 's' : ''}</h2>
                </div>

                <div className="space-y-4">
                    {recs.map(rec => <RecCard key={rec.id} rec={rec} />)}
                </div>
            </div>
        </div>
    );
}
