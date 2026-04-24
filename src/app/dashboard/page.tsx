'use client';

import { useState, useMemo } from 'react';
import {
    TrendingUp,
    CreditCard,
    Zap,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    LineChart,
    Target,
    Brain,
    Globe,
    Settings,
    ChevronRight,
    Activity,
    DollarSign,
    Layers,
} from 'lucide-react';
import {
    SUBSCRIPTION_PLANS,
    CREDIT_PACKS,
    DAILY_ALLOWANCE,
    type SubscriptionTier,
    type PricingScenario,
} from '@/lib/types';
import {
    getMonthlyCost,
    getTotalMonthlyCredits,
    getCostPerCredit,
    getWastedCredits,
    generateProjection,
} from '@/lib/credit-models';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/lib/auth-context';

// ============================================
// Metric Card Component
// ============================================

interface MetricCardProps {
    label: string;
    value: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon: React.ElementType;
    accentColor?: string;
}

function MetricCard({ label, value, subtitle, trend, trendValue, icon: Icon, accentColor }: MetricCardProps) {
    return (
        <div className="metric-card card-hover group">
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                     style={{ background: 'var(--background-tertiary)' }}>
                    <Icon size={18} className="text-[var(--primary-light)] group-hover:text-[var(--accent-light)] transition-colors" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        trend === 'up' ? 'text-[var(--success)] bg-[var(--success)]/10' :
                        trend === 'down' ? 'text-[var(--error)] bg-[var(--error)]/10' :
                        'text-[var(--foreground-muted)] bg-[var(--background-tertiary)]'
                    }`}>
                        {trend === 'up' ? <ArrowUpRight size={12} /> :
                         trend === 'down' ? <ArrowDownRight size={12} /> :
                         <Minus size={12} />}
                        {trendValue}
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: accentColor }}>{value}</div>
            <div className="text-sm text-[var(--foreground-muted)]">{label}</div>
            {subtitle && <div className="text-xs text-[var(--foreground-muted)] mt-1 opacity-60">{subtitle}</div>}
        </div>
    );
}

// ============================================
// Tier Comparison Table
// ============================================

function TierComparisonTable({ currentTier }: { currentTier: SubscriptionTier }) {
    const tiers: SubscriptionTier[] = ['free', 'standard', 'pro'];

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-[var(--border)]">
                        <th className="text-left py-3 px-4 text-[var(--foreground-muted)] font-medium">Metric</th>
                        {tiers.map(tier => (
                            <th key={tier} className={`text-center py-3 px-4 font-medium ${
                                tier === currentTier ? 'text-[var(--primary-light)]' : 'text-[var(--foreground-muted)]'
                            }`}>
                                {SUBSCRIPTION_PLANS[tier].name}
                                {tier === currentTier && <span className="ml-1 text-xs">(Current)</span>}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[
                        { label: 'Monthly Cost', fn: (t: SubscriptionTier) => `$${getMonthlyCost(t).toFixed(2)}` },
                        { label: 'Daily Allowance', fn: (t: SubscriptionTier) => `${DAILY_ALLOWANCE[t]} credits` },
                        { label: 'Monthly Bonus', fn: (t: SubscriptionTier) => `${SUBSCRIPTION_PLANS[t].creditsPerMonth}` },
                        { label: 'Total Monthly', fn: (t: SubscriptionTier) => `${getTotalMonthlyCredits(t)}` },
                        { label: 'Cost/Credit (at 200/mo)', fn: (t: SubscriptionTier) => `$${getCostPerCredit(t, 200).toFixed(3)}` },
                        { label: 'Scenarios', fn: (t: SubscriptionTier) => `${SUBSCRIPTION_PLANS[t].scenarioLimit === Infinity ? '∞' : SUBSCRIPTION_PLANS[t].scenarioLimit}` },
                        { label: 'Deep Research', fn: (t: SubscriptionTier) => `${SUBSCRIPTION_PLANS[t].deepResearchQuota === Infinity ? '∞' : SUBSCRIPTION_PLANS[t].deepResearchQuota}/mo` },
                    ].map((row, i) => (
                        <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--background-tertiary)]/50 transition-colors">
                            <td className="py-3 px-4 text-[var(--foreground-muted)]">{row.label}</td>
                            {tiers.map(tier => (
                                <td key={tier} className={`text-center py-3 px-4 font-mono ${
                                    tier === currentTier ? 'text-[var(--foreground)] font-semibold' : 'text-[var(--foreground-muted)]'
                                }`}>
                                    {row.fn(tier)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============================================
// Quick Projection Mini-Chart (CSS-based)
// ============================================

function MiniProjectionBars({ tier, usage }: { tier: SubscriptionTier; usage: number }) {
    const scenario: PricingScenario = {
        id: 'quick',
        userId: '',
        name: 'Quick',
        useCase: 'general',
        tier,
        monthlyUsage: usage,
        growthRate: 0,
        creditPackStrategy: 'none',
        customPacks: [],
        isPublic: false,
        createdAt: null,
        updatedAt: null,
    };

    const projection = generateProjection(scenario, 6);
    const maxCost = Math.max(...projection.map(p => p.totalCost), 1);

    return (
        <div className="flex items-end gap-1.5 h-16">
            {projection.map((p, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className="w-full rounded-t transition-all duration-500"
                        style={{
                            height: `${Math.max((p.totalCost / maxCost) * 100, 4)}%`,
                            background: 'var(--gradient-brand)',
                            opacity: 0.5 + (i / projection.length) * 0.5,
                        }}
                    />
                    <span className="text-[9px] text-[var(--foreground-muted)]">M{p.month}</span>
                </div>
            ))}
        </div>
    );
}

// (NavItem removed in favor of shared Sidebar)

// ============================================
// Dashboard Page
// ============================================

export default function DashboardPage() {
    const { profile, credits, loading } = useAuth();
    
    const currentTier = (profile?.subscription || 'free') as SubscriptionTier;
    // Use real usage from credits if available, otherwise estimate from tier
    const monthlyUsage = credits?.totalUsed || 0;
    const creditBalance = credits?.balance || 0;
    const dailyUsed = credits?.dailyAllowanceUsed || 0;

    const totalCredits = useMemo(() => getTotalMonthlyCredits(currentTier), [currentTier]);
    const monthlyCost = useMemo(() => getMonthlyCost(currentTier), [currentTier]);
    const costPerCredit = useMemo(() => getCostPerCredit(currentTier, monthlyUsage || totalCredits), [currentTier, monthlyUsage, totalCredits]);
    const wasted = useMemo(() => getWastedCredits(currentTier, monthlyUsage || 0), [currentTier, monthlyUsage]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold">Credit Dashboard</h1>
                            <p className="text-sm text-[var(--foreground-muted)] mt-1">Your AI credit analytics at a glance</p>
                        </div>
                        <Link href="/modeller" className="btn-primary text-sm flex items-center gap-2">
                            <Zap size={16} />
                            New Scenario
                        </Link>
                    </div>

                    {/* Get Started Quick Actions */}
                    <div className="mb-12">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-4 px-1">Get Started</h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            <Link href="/modeller" className="glass p-6 rounded-3xl border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all group">
                                <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)]/10 flex items-center justify-center text-[var(--primary)] mb-4">
                                    <LineChart size={20} />
                                </div>
                                <h3 className="text-sm font-bold mb-1">Model Scenarios</h3>
                                <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wide leading-relaxed">Compare pricing tiers for your use case</p>
                            </Link>
                            <Link href="/research" className="glass p-6 rounded-3xl border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all group">
                                <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)]/10 flex items-center justify-center text-[var(--accent)] mb-4">
                                    <Brain size={20} />
                                </div>
                                <h3 className="text-sm font-bold mb-1">Research Hub</h3>
                                <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wide leading-relaxed">Centre of Excellence for token economics</p>
                            </Link>
                            <Link href="/tuner" className="glass p-6 rounded-3xl border border-[var(--border)] hover:border-[var(--warning)]/30 transition-all group">
                                <div className="w-10 h-10 rounded-xl bg-[var(--warning-light)]/10 flex items-center justify-center text-[var(--warning)] mb-4">
                                    <Activity size={20} />
                                </div>
                                <h3 className="text-sm font-bold mb-1">Interactive Tuner</h3>
                                <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wide leading-relaxed">Fine-tune your growth and usage parameters</p>
                            </Link>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <MetricCard
                            icon={DollarSign}
                            label="Monthly Cost"
                            value={`$${monthlyCost.toFixed(2)}`}
                            subtitle={currentTier === 'free' ? 'Free tier' : 'Subscription'}
                            trend="neutral"
                            trendValue="Stable"
                        />
                        <MetricCard
                            icon={Layers}
                            label="Credit Balance"
                            value={`${creditBalance}`}
                            subtitle={`${dailyUsed}/${DAILY_ALLOWANCE[currentTier]} daily used`}
                            trend={creditBalance > 50 ? 'up' : creditBalance > 0 ? 'neutral' : 'down'}
                            trendValue={creditBalance > 50 ? 'Healthy' : creditBalance > 0 ? 'Low' : 'Depleted'}
                        />
                        <MetricCard
                            icon={Activity}
                            label="Cost per Credit"
                            value={monthlyCost === 0 ? 'Free' : `$${costPerCredit.toFixed(3)}`}
                            subtitle={`At ${monthlyUsage} usage/mo`}
                            trend={monthlyCost === 0 ? 'neutral' : 'down'}
                            trendValue={monthlyCost === 0 ? 'N/A' : 'Efficient'}
                        />
                        <MetricCard
                            icon={BarChart3}
                            label="Wasted Credits"
                            value={`${wasted}`}
                            subtitle="Unused from allowance"
                            trend={wasted > 50 ? 'down' : 'neutral'}
                            trendValue={wasted > 50 ? 'High waste' : 'OK'}
                        />
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid lg:grid-cols-2 gap-6 mb-8">
                        {/* Tier Comparison */}
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Tier Comparison</h2>
                                <span className="text-xs text-[var(--foreground-muted)] px-2 py-1 rounded-full bg-[var(--background-tertiary)]">
                                    Numbers first
                                </span>
                            </div>
                            <TierComparisonTable currentTier={currentTier} />
                        </div>

                        {/* Quick Projection */}
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">6-Month Projection</h2>
                                <a href="/modeller" className="text-xs text-[var(--primary-light)] flex items-center gap-1 hover:underline">
                                    Full Modeller <ChevronRight size={12} />
                                </a>
                            </div>
                            <div className="space-y-6">
                                {(['free', 'standard', 'pro'] as SubscriptionTier[]).map(tier => (
                                    <div key={tier}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">{SUBSCRIPTION_PLANS[tier].name}</span>
                                            <span className="text-xs text-[var(--foreground-muted)] font-mono">
                                                6mo: ${(getMonthlyCost(tier) * 6).toFixed(2)}
                                            </span>
                                        </div>
                                        <MiniProjectionBars tier={tier} usage={monthlyUsage} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Credit Packs */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Credit Packs</h2>
                            <span className="text-xs text-[var(--foreground-muted)]">One-time purchases</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {CREDIT_PACKS.map(pack => (
                                <div key={pack.id} className="metric-card card-hover text-center">
                                    <div className="text-2xl font-bold gradient-text mb-1">{pack.credits.toLocaleString()}</div>
                                    <div className="text-xs text-[var(--foreground-muted)] mb-3">credits</div>
                                    <div className="text-lg font-semibold mb-1">${(pack.price / 100).toFixed(2)}</div>
                                    <div className="text-xs text-[var(--foreground-muted)]">
                                        ${(pack.price / 100 / pack.credits).toFixed(3)}/credit
                                    </div>
                                    <button className="btn-secondary text-xs mt-4 w-full py-2">
                                        Purchase
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
