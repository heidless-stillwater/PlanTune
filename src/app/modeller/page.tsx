'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
    TrendingUp,
    LineChart,
    Sliders,
    Plus,
    Trash2,
    Copy,
    ChevronDown,
    ChevronRight,
    Zap,
    DollarSign,
    Activity,
    BarChart3,
    Layers,
    ArrowLeft,
} from 'lucide-react';
import {
    SUBSCRIPTION_PLANS,
    CREDIT_PACKS,
    type SubscriptionTier,
    type PricingScenario,
    type ProjectionResult,
} from '@/lib/types';
import {
    getMonthlyCost,
    getTotalMonthlyCredits,
    getCostPerCredit,
    getWastedCredits,
    generateProjection,
    compareScenarios,
    findBreakEvenMonth,
} from '@/lib/credit-models';
import {
    CumulativeCostChart,
    CreditBalanceChart,
    CostPerCreditChart,
} from '@/components/charts/ProjectionChart';

// ============================================
// Scenario Builder Panel
// ============================================

interface ScenarioFormProps {
    scenario: PricingScenario;
    onChange: (s: PricingScenario) => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    index: number;
}

function ScenarioForm({ scenario, onChange, onDelete, onDuplicate, index }: ScenarioFormProps) {
    const [expanded, setExpanded] = useState(true);

    const update = <K extends keyof PricingScenario>(key: K, value: PricingScenario[K]) => {
        onChange({ ...scenario, [key]: value });
    };

    const tierColors: Record<SubscriptionTier, string> = {
        free: 'border-slate-500/30',
        standard: 'border-[var(--primary)]/30',
        pro: 'border-[var(--accent)]/30',
    };

    return (
        <div className={`glass rounded-2xl overflow-hidden border-l-4 ${tierColors[scenario.tier]} transition-all`}>
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--background-tertiary)]/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                         style={{ background: 'var(--gradient-brand)' }}>
                        {index + 1}
                    </div>
                    <div>
                        <input
                            className="bg-transparent text-sm font-semibold outline-none border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] transition-colors w-48"
                            value={scenario.name}
                            onChange={(e) => update('name', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="text-xs text-[var(--foreground-muted)] mt-0.5">
                            {SUBSCRIPTION_PLANS[scenario.tier].name} · {scenario.monthlyUsage} credits/mo · {scenario.growthRate}% growth
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onDuplicate && (
                        <button
                            className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] rounded-lg transition-all"
                            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                            title="Duplicate"
                        >
                            <Copy size={14} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            className="p-2 text-[var(--foreground-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-all"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    {expanded ? <ChevronDown size={16} className="text-[var(--foreground-muted)]" /> : <ChevronRight size={16} className="text-[var(--foreground-muted)]" />}
                </div>
            </div>

            {/* Body */}
            {expanded && (
                <div className="px-4 pb-5 pt-1 space-y-5 border-t border-[var(--border)]">
                    {/* Tier Selector */}
                    <div>
                        <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 block">
                            Subscription Tier
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['free', 'standard', 'pro'] as SubscriptionTier[]).map((tier) => (
                                <button
                                    key={tier}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                                        scenario.tier === tier
                                            ? 'bg-[var(--primary)]/15 text-[var(--primary-light)] border border-[var(--border-accent)] shadow-sm'
                                            : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] border border-[var(--border)] hover:border-[var(--border-accent)]'
                                    }`}
                                    onClick={() => update('tier', tier)}
                                >
                                    {SUBSCRIPTION_PLANS[tier].name}
                                    <div className="text-[10px] mt-0.5 opacity-60">
                                        ${getMonthlyCost(tier).toFixed(2)}/mo
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Usage Slider */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                                Monthly Usage
                            </label>
                            <span className="text-sm font-mono font-bold text-[var(--primary-light)]">
                                {scenario.monthlyUsage} credits
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={2000}
                            step={10}
                            value={scenario.monthlyUsage}
                            onChange={(e) => update('monthlyUsage', Number(e.target.value))}
                            className="w-full accent-[var(--primary)] h-2 rounded-full bg-[var(--background-tertiary)] appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-[var(--foreground-muted)] mt-1">
                            <span>0</span>
                            <span>500</span>
                            <span>1,000</span>
                            <span>1,500</span>
                            <span>2,000</span>
                        </div>
                    </div>

                    {/* Growth Rate */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                                Monthly Growth Rate
                            </label>
                            <span className="text-sm font-mono font-bold text-[var(--accent-light)]">
                                {scenario.growthRate}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={50}
                            step={1}
                            value={scenario.growthRate}
                            onChange={(e) => update('growthRate', Number(e.target.value))}
                            className="w-full accent-[var(--accent)] h-2 rounded-full bg-[var(--background-tertiary)] appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-[var(--foreground-muted)] mt-1">
                            <span>0%</span>
                            <span>10%</span>
                            <span>25%</span>
                            <span>50%</span>
                        </div>
                    </div>

                    {/* Pack Strategy */}
                    <div>
                        <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 block">
                            Credit Pack Strategy
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'none', label: 'No Packs' },
                                { id: 'as-needed', label: 'Auto Buy' },
                                { id: 'bulk-quarterly', label: 'Quarterly Bulk' },
                                { id: 'custom', label: 'Custom' },
                            ].map((strat) => (
                                <button
                                    key={strat.id}
                                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                                        scenario.creditPackStrategy === strat.id
                                            ? 'bg-[var(--primary)]/15 text-[var(--primary-light)] border border-[var(--border-accent)]'
                                            : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] border border-[var(--border)] hover:border-[var(--border-accent)]'
                                    }`}
                                    onClick={() => update('creditPackStrategy', strat.id as any)}
                                >
                                    {strat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// Stat Pill
// ============================================

function StatPill({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
    return (
        <div className="metric-card !p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--background-tertiary)' }}>
                <Icon size={16} className="text-[var(--primary-light)]" />
            </div>
            <div>
                <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
                <div className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

// ============================================
// Chart Selector Tabs
// ============================================

type ChartView = 'cost' | 'credits' | 'efficiency';

function ChartTabs({ active, onChange }: { active: ChartView; onChange: (v: ChartView) => void }) {
    const tabs: { id: ChartView; label: string; icon: React.ElementType }[] = [
        { id: 'cost', label: 'Cumulative Cost', icon: DollarSign },
        { id: 'credits', label: 'Credit Flow', icon: Layers },
        { id: 'efficiency', label: 'Efficiency', icon: Activity },
    ];

    return (
        <div className="flex gap-1 bg-[var(--background-tertiary)] p-1 rounded-xl">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        active === tab.id
                            ? 'bg-[var(--primary)]/15 text-[var(--primary-light)]'
                            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                    onClick={() => onChange(tab.id)}
                >
                    <tab.icon size={14} />
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

// ============================================
// Horizon Selector
// ============================================

function HorizonSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    const options = [3, 6, 12, 24, 36];
    return (
        <div className="flex gap-1 bg-[var(--background-tertiary)] p-1 rounded-xl">
            {options.map((n) => (
                <button
                    key={n}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        value === n
                            ? 'bg-[var(--primary)]/15 text-[var(--primary-light)]'
                            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                    onClick={() => onChange(n)}
                >
                    {n}mo
                </button>
            ))}
        </div>
    );
}

// ============================================
// Modeller Page
// ============================================

function createDefaultScenario(id: string, name: string, tier: SubscriptionTier = 'free'): PricingScenario {
    return {
        id,
        userId: '',
        name,
        useCase: 'general',
        tier,
        monthlyUsage: 200,
        growthRate: 5,
        creditPackStrategy: 'none',
        customPacks: [],
        isPublic: false,
        createdAt: null,
        updatedAt: null,
    };
}

export default function ModellerPage() {
    const [scenarios, setScenarios] = useState<PricingScenario[]>([
        createDefaultScenario('s1', 'Casual Creator', 'free'),
        createDefaultScenario('s2', 'Growing Studio', 'standard'),
    ]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [chartView, setChartView] = useState<ChartView>('cost');
    const [horizon, setHorizon] = useState(12);

    const activeScenario = scenarios[activeIndex] || scenarios[0];

    // Generate projections
    const projections = useMemo(() => {
        return scenarios.map((s) => generateProjection(s, horizon));
    }, [scenarios, horizon]);

    const activeProjection = projections[activeIndex] || projections[0];

    // Comparison data (second scenario if exists)
    const comparisonProjection = projections.length > 1 && activeIndex === 0 ? projections[1] : undefined;

    // Summary stats for active scenario
    const lastMonth = activeProjection?.[activeProjection.length - 1];
    const totalCost = lastMonth?.totalCost ?? 0;
    const avgCostPerCredit = activeProjection
        ? activeProjection.reduce((sum, p) => sum + p.costPerCredit, 0) / activeProjection.length
        : 0;
    const totalWasted = activeProjection
        ? activeProjection.reduce((sum, p) => sum + p.wastedCredits, 0)
        : 0;

    // Break-even analysis
    const breakEven = scenarios.length >= 2
        ? findBreakEvenMonth(activeScenario.monthlyUsage, scenarios[0].tier, scenarios[1].tier)
        : null;

    // Handlers
    const updateScenario = useCallback((index: number, updated: PricingScenario) => {
        setScenarios((prev) => prev.map((s, i) => (i === index ? updated : s)));
    }, []);

    const addScenario = () => {
        const id = `s${Date.now()}`;
        setScenarios((prev) => [...prev, createDefaultScenario(id, `Scenario ${prev.length + 1}`, 'pro')]);
    };

    const deleteScenario = (index: number) => {
        if (scenarios.length <= 1) return;
        setScenarios((prev) => prev.filter((_, i) => i !== index));
        if (activeIndex >= scenarios.length - 1) setActiveIndex(Math.max(0, activeIndex - 1));
    };

    const duplicateScenario = (index: number) => {
        const original = scenarios[index];
        const id = `s${Date.now()}`;
        setScenarios((prev) => [...prev, { ...original, id, name: `${original.name} (Copy)` }]);
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-80 border-r border-[var(--border)] bg-[var(--background-secondary)] flex flex-col sticky top-0 h-screen overflow-y-auto">
                <div className="p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-4">
                        <a href="/dashboard" className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] rounded-lg transition-all">
                            <ArrowLeft size={16} />
                        </a>
                        <div>
                            <h1 className="text-lg font-bold">Scenario Modeller</h1>
                            <p className="text-xs text-[var(--foreground-muted)]">Build & compare credit strategies</p>
                        </div>
                    </div>
                    <button
                        className="btn-primary text-xs w-full flex items-center justify-center gap-2"
                        onClick={addScenario}
                    >
                        <Plus size={14} />
                        Add Scenario
                    </button>
                </div>

                {/* Scenario Tabs */}
                <div className="flex border-b border-[var(--border)]">
                    {scenarios.map((s, i) => (
                        <button
                            key={s.id}
                            className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 ${
                                activeIndex === i
                                    ? 'border-[var(--primary)] text-[var(--primary-light)] bg-[var(--primary)]/5'
                                    : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                            }`}
                            onClick={() => setActiveIndex(i)}
                        >
                            {s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name}
                        </button>
                    ))}
                </div>

                {/* Active Scenario Form */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {scenarios.map((s, i) => (
                        <div key={s.id} className={i !== activeIndex ? 'hidden' : ''}>
                            <ScenarioForm
                                scenario={s}
                                onChange={(updated) => updateScenario(i, updated)}
                                onDelete={scenarios.length > 1 ? () => deleteScenario(i) : undefined}
                                onDuplicate={() => duplicateScenario(i)}
                                index={i}
                            />
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {/* Summary Strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                        <StatPill
                            icon={DollarSign}
                            label={`${horizon}mo Total Cost`}
                            value={`$${totalCost.toFixed(2)}`}
                        />
                        <StatPill
                            icon={Activity}
                            label="Avg Cost/Credit"
                            value={avgCostPerCredit > 0 ? `$${avgCostPerCredit.toFixed(3)}` : 'Free'}
                            color={avgCostPerCredit > 0.05 ? 'var(--warning)' : 'var(--success)'}
                        />
                        <StatPill
                            icon={BarChart3}
                            label="Total Wasted"
                            value={`${totalWasted.toLocaleString()}`}
                            color={totalWasted > 500 ? 'var(--error)' : undefined}
                        />
                        <StatPill
                            icon={Zap}
                            label="Break-Even"
                            value={breakEven ? `Month ${breakEven}` : 'N/A'}
                        />
                    </div>

                    {/* Chart Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <ChartTabs active={chartView} onChange={setChartView} />
                        <HorizonSelector value={horizon} onChange={setHorizon} />
                    </div>

                    {/* Chart */}
                    <div className="glass rounded-2xl p-6 mb-8">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">
                                {chartView === 'cost' && 'Cumulative Cost Projection'}
                                {chartView === 'credits' && 'Credit Balance & Usage'}
                                {chartView === 'efficiency' && 'Cost Efficiency Over Time'}
                            </h2>
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                {activeScenario.name} · {SUBSCRIPTION_PLANS[activeScenario.tier].name} tier · {horizon} months
                            </p>
                        </div>

                        {chartView === 'cost' && (
                            <CumulativeCostChart
                                data={activeProjection}
                                comparisonData={comparisonProjection}
                                primaryLabel={scenarios[0]?.name || 'Plan A'}
                                comparisonLabel={scenarios[1]?.name || 'Plan B'}
                                height={380}
                            />
                        )}
                        {chartView === 'credits' && (
                            <CreditBalanceChart data={activeProjection} height={380} />
                        )}
                        {chartView === 'efficiency' && (
                            <CostPerCreditChart data={activeProjection} height={380} />
                        )}
                    </div>

                    {/* Side-by-Side Comparison Table */}
                    {scenarios.length >= 2 && (
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4">Scenario Comparison</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            <th className="text-left py-3 px-4 text-[var(--foreground-muted)] font-medium">Metric</th>
                                            {scenarios.map((s, i) => (
                                                <th key={s.id} className={`text-center py-3 px-4 font-medium ${
                                                    i === activeIndex ? 'text-[var(--primary-light)]' : 'text-[var(--foreground-muted)]'
                                                }`}>
                                                    {s.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { label: 'Tier', fn: (i: number) => SUBSCRIPTION_PLANS[scenarios[i].tier].name },
                                            { label: `${horizon}mo Total Cost`, fn: (i: number) => `$${(projections[i]?.[projections[i].length - 1]?.totalCost ?? 0).toFixed(2)}` },
                                            { label: 'Monthly Cost', fn: (i: number) => `$${getMonthlyCost(scenarios[i].tier).toFixed(2)}` },
                                            { label: 'Monthly Credits', fn: (i: number) => `${getTotalMonthlyCredits(scenarios[i].tier)}` },
                                            { label: 'Usage Target', fn: (i: number) => `${scenarios[i].monthlyUsage}/mo` },
                                            { label: 'Growth Rate', fn: (i: number) => `${scenarios[i].growthRate}%` },
                                            { label: 'Pack Strategy', fn: (i: number) => scenarios[i].creditPackStrategy },
                                            { label: 'Total Wasted', fn: (i: number) => `${(projections[i]?.reduce((s, p) => s + p.wastedCredits, 0) ?? 0).toLocaleString()}` },
                                        ].map((row, ri) => (
                                            <tr key={ri} className="border-b border-[var(--border)] hover:bg-[var(--background-tertiary)]/50 transition-colors">
                                                <td className="py-3 px-4 text-[var(--foreground-muted)]">{row.label}</td>
                                                {scenarios.map((_, i) => (
                                                    <td key={i} className={`text-center py-3 px-4 font-mono ${
                                                        i === activeIndex ? 'text-[var(--foreground)] font-semibold' : 'text-[var(--foreground-muted)]'
                                                    }`}>
                                                        {row.fn(i)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
