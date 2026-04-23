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
import { SuiteSwitcher } from '@/components/layout/SuiteSwitcher';

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

// ============================================
// Nav Sidebar Item
// ============================================

function NavItem({ icon: Icon, label, active, href }: { icon: React.ElementType; label: string; active?: boolean; href: string }) {
    return (
        <a href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            active
                ? 'bg-[var(--primary)]/10 text-[var(--primary-light)] border border-[var(--border-accent)]'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'
        }`}>
            <Icon size={18} />
            {label}
        </a>
    );
}

// ============================================
// Dashboard Page
// ============================================

export default function DashboardPage() {
    const [currentTier] = useState<SubscriptionTier>('free');
    const [monthlyUsage] = useState(200);

    const totalCredits = useMemo(() => getTotalMonthlyCredits(currentTier), [currentTier]);
    const monthlyCost = useMemo(() => getMonthlyCost(currentTier), [currentTier]);
    const costPerCredit = useMemo(() => getCostPerCredit(currentTier, monthlyUsage), [currentTier, monthlyUsage]);
    const wasted = useMemo(() => getWastedCredits(currentTier, monthlyUsage), [currentTier, monthlyUsage]);

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[var(--border)] bg-[var(--background-secondary)] p-4 flex flex-col gap-2 sticky top-0 h-screen">
                <div className="flex items-center gap-3 px-4 py-4 mb-2">
                    <SuiteSwitcher />
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-brand)' }}>
                            <TrendingUp size={16} className="text-white" />
                        </div>
                        <span className="text-base font-bold gradient-text">PlanTune</span>
                    </div>
                </div>

                <NavItem icon={BarChart3} label="Dashboard" active href="/dashboard" />
                <NavItem icon={LineChart} label="Modeller" href="/modeller" />
                <NavItem icon={Target} label="Recommendations" href="/recommendations" />
                <NavItem icon={Activity} label="Tuner" href="/tuner" />
                <NavItem icon={Brain} label="Research" href="/research" />
                <NavItem icon={Globe} label="Arbitrage" href="/arbitrage" />

                <div className="section-divider" />

                <NavItem icon={CreditCard} label="Pricing & Packs" href="/pricing" />
                <NavItem icon={Settings} label="Settings" href="/settings" />

                <div className="mt-auto px-4 py-3">
                    <div className="metric-card !p-3 text-center">
                        <div className="text-xs text-[var(--foreground-muted)] mb-1">Current Plan</div>
                        <div className="text-sm font-bold gradient-text">{SUBSCRIPTION_PLANS[currentTier].name}</div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold">Credit Dashboard</h1>
                            <p className="text-sm text-[var(--foreground-muted)] mt-1">Your AI credit analytics at a glance</p>
                        </div>
                        <button className="btn-primary text-sm flex items-center gap-2">
                            <Zap size={16} />
                            New Scenario
                        </button>
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
                            label="Credits Available"
                            value={`${totalCredits}`}
                            subtitle={`${DAILY_ALLOWANCE[currentTier]}/day + ${SUBSCRIPTION_PLANS[currentTier].creditsPerMonth} bonus`}
                            trend="up"
                            trendValue="Monthly"
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
