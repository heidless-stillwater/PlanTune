'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
    Download,
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
import { MultiScenarioCostChart, MultiScenarioBalanceChart } from '@/components/charts/MultiScenarioChart';
import { exportMultiScenarioCSV } from '@/lib/services/export-service';
import {
    subscribeToScenarios,
    createScenario as createScenarioInDb,
    updateScenario as updateScenarioInDb,
    deleteScenario as deleteScenarioInDb,
} from '@/lib/services/scenario-service';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';

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

    return (
        <div className={`glass rounded-3xl overflow-hidden transition-all duration-300 border ${
            index === 0 ? 'border-teal-500/30 bg-teal-500/[0.02]' : 'border-white/5 bg-white/[0.01]'
        }`}>
            <div 
                className="px-6 py-4 flex items-center justify-between cursor-pointer group"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                        index === 0 ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/40'
                    }`}>
                        {index + 1}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">{scenario.name || 'Untitled Scenario'}</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
                            {SUBSCRIPTION_PLANS[scenario.tier].name} • {scenario.monthlyUsage} units/mo
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onDuplicate && (
                        <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-2 text-white/20 hover:text-white transition-colors">
                            <Copy size={14} />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-white/20 hover:text-rose-400 transition-colors">
                            <Trash2 size={14} />
                        </button>
                    )}
                    <div className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={18} className="text-white/20" />
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="px-6 pb-8 pt-2 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Scenario Identity</label>
                        <input
                            type="text"
                            value={scenario.name}
                            onChange={(e) => update('name', e.target.value)}
                            placeholder="e.g. Creator-SaaS Baseline"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-teal-500/50 transition-all text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Base Usage / Mo</label>
                            <input
                                type="number"
                                value={scenario.monthlyUsage}
                                onChange={(e) => update('monthlyUsage', Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-teal-500/50 transition-all text-white font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Growth Rate %</label>
                            <input
                                type="number"
                                value={scenario.growthRate}
                                onChange={(e) => update('growthRate', Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-teal-500/50 transition-all text-white font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Infrastructure Tier</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['free', 'standard', 'pro'] as SubscriptionTier[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => update('tier', t)}
                                    className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                        scenario.tier === t
                                            ? 'bg-teal-500/10 border-teal-500/50 text-teal-400'
                                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Pack Strategy</label>
                        <select
                            value={scenario.creditPackStrategy}
                            onChange={(e) => update('creditPackStrategy', e.target.value as any)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-teal-500/50 transition-all text-white appearance-none"
                        >
                            <option value="none">No Automated Packs</option>
                            <option value="as-needed">Buy Packs as Needed</option>
                            <option value="bulk-quarterly">Bulk Purchase Quarterly</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// Page
// ============================================

export default function ModellerPage() {
    const { profile, loading } = useAuth();
    const currentTier = (profile?.subscription || 'free') as SubscriptionTier;

    // Default fallback when no Firestore scenarios exist yet
    const defaultScenario: PricingScenario = {
        id: 'local-default',
        userId: profile?.uid || 'anon',
        name: 'Standard Growth',
        useCase: 'saas',
        tier: 'standard',
        monthlyUsage: 300,
        growthRate: 10,
        creditPackStrategy: 'none',
        customPacks: [],
        isPublic: false,
        createdAt: null,
        updatedAt: null,
    };

    const [scenarios, setScenarios] = useState<PricingScenario[]>([defaultScenario]);
    const [firestoreLoaded, setFirestoreLoaded] = useState(false);
    const [horizon, setHorizon] = useState(12);

    // Subscribe to Firestore scenarios in real time
    useEffect(() => {
        if (!profile?.uid) return;

        const unsubscribe = subscribeToScenarios(profile.uid, (dbScenarios) => {
            if (dbScenarios.length > 0) {
                setScenarios(dbScenarios);
            } else if (!firestoreLoaded) {
                // First load, no saved scenarios — keep the local default
                setScenarios([defaultScenario]);
            }
            setFirestoreLoaded(true);
        });

        return () => unsubscribe();
    }, [profile?.uid]);

    const projections = useMemo(() => {
        return scenarios.map(s => generateProjection(s, horizon));
    }, [scenarios, horizon]);

    const compared = useMemo(() => compareScenarios(scenarios, horizon), [scenarios, horizon]);
    const scenarioLabels = scenarios.map(s => s.name || 'Untitled');

    const tierLimit = SUBSCRIPTION_PLANS[currentTier].scenarioLimit;

    const addScenario = async () => {
        if (scenarios.length >= tierLimit) {
            alert(`Scenario limit reached (${scenarios.length}/${tierLimit}). Upgrade your plan to add more.`);
            return;
        }

        const last = scenarios[scenarios.length - 1];

        if (profile?.uid) {
            // Persist to Firestore — the subscription will update local state
            try {
                await createScenarioInDb({
                    userId: profile.uid,
                    name: `${last.name} (Copy)`,
                    useCase: last.useCase,
                    tier: last.tier,
                    monthlyUsage: last.monthlyUsage,
                    growthRate: last.growthRate,
                    creditPackStrategy: last.creditPackStrategy,
                    customPacks: last.customPacks,
                    isPublic: false,
                }, currentTier);
            } catch (err: any) {
                alert(err.message || 'Failed to create scenario');
            }
        } else {
            // Offline fallback
            const newScenario: PricingScenario = {
                ...last,
                id: Math.random().toString(36).substr(2, 9),
                name: `${last.name} (Copy)`,
            };
            setScenarios([...scenarios, newScenario]);
        }
    };

    const updateScenario = async (index: number, scenario: PricingScenario) => {
        // Optimistic local update
        const next = [...scenarios];
        next[index] = scenario;
        setScenarios(next);

        // Persist to Firestore if it's a saved scenario
        if (profile?.uid && scenario.id && !scenario.id.startsWith('local-')) {
            try {
                const { id, userId, createdAt, ...updates } = scenario;
                await updateScenarioInDb(profile.uid, scenario.id, updates);
            } catch (err) {
                console.error('Failed to update scenario in Firestore:', err);
            }
        }
    };

    const deleteScenario = async (index: number) => {
        if (scenarios.length <= 1) return;
        const target = scenarios[index];

        // Optimistic local delete
        setScenarios(scenarios.filter((_, i) => i !== index));

        // Delete from Firestore
        if (profile?.uid && target.id && !target.id.startsWith('local-')) {
            try {
                await deleteScenarioInDb(profile.uid, target.id);
            } catch (err) {
                console.error('Failed to delete scenario from Firestore:', err);
            }
        }
    };

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
                                <LineChart size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight uppercase">Strategy <span className="text-teal-400">Modeller</span></h1>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] -mt-1">Multi-Scenario Projection</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                                {[12, 24, 60].map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => setHorizon(h)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                            horizon === h ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-white/40 hover:text-white'
                                        }`}
                                    >
                                        {h}M
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => exportMultiScenarioCSV(scenarios, projections, horizon)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-black uppercase tracking-wider text-white/60 hover:text-white"
                            >
                                <Download size={14} /> Export CSV
                            </button>
                            <button onClick={addScenario} className="btn-primary !rounded-xl px-4 py-2 text-xs flex items-center gap-2">
                                <Plus size={16} /> Add Scenario
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 grid lg:grid-cols-12 overflow-hidden">
                    {/* Left: Input Panel */}
                    <div className="lg:col-span-4 border-r border-white/5 p-8 overflow-y-auto space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Active Scenarios</h2>
                            <span className="text-[10px] font-mono text-white/20">{scenarios.length} / {tierLimit === Infinity ? '∞' : tierLimit} LIMIT</span>
                        </div>
                        
                        <div className="space-y-4">
                            {scenarios.map((s, i) => (
                                <ScenarioForm 
                                    key={s.id} 
                                    scenario={s} 
                                    index={i}
                                    onChange={(updated) => updateScenario(i, updated)}
                                    onDelete={scenarios.length > 1 ? () => deleteScenario(i) : undefined}
                                    onDuplicate={addScenario}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right: Visualization Panel */}
                    <div className="lg:col-span-8 p-8 overflow-y-auto space-y-8 bg-white/[0.01]">
                        {/* Multi-Scenario Cost Overlay */}
                        <div className="glass rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.3em]">Cumulative Cost Projection</h3>
                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-1">Comparing {scenarios.length} scenario{scenarios.length > 1 ? 's' : ''} over {horizon} months</p>
                                </div>
                            </div>
                            <div className="h-[400px]">
                                <MultiScenarioCostChart projections={projections} labels={scenarioLabels} height={400} />
                            </div>
                        </div>

                        {/* Scenario Rankings */}
                        {compared.length > 1 && (
                            <div className="glass rounded-[2.5rem] p-8 border border-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Scenario Rankings</h3>
                                <div className="space-y-3">
                                    {compared.map((c) => {
                                        const lastMonth = c.projection[c.projection.length - 1];
                                        return (
                                            <div key={c.scenario.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                                c.rank === 1 ? 'bg-teal-500/10 border-teal-500/30' : 'bg-white/[0.02] border-white/5'
                                            }`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                                        c.rank === 1 ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/40'
                                                    }`}>
                                                        #{c.rank}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold">{c.scenario.name}</div>
                                                        <div className="text-[10px] text-white/30 font-mono">
                                                            {SUBSCRIPTION_PLANS[c.scenario.tier].name} · {c.scenario.monthlyUsage} units/mo
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black font-mono">${lastMonth?.totalCost.toFixed(2)}</div>
                                                    <div className="text-[10px] text-white/30 font-mono">${lastMonth?.costPerCredit.toFixed(3)}/credit</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="glass rounded-[2.5rem] p-8 border border-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Credit Inventory Overlay</h3>
                                <div className="h-[250px]">
                                    <MultiScenarioBalanceChart projections={projections} labels={scenarioLabels} height={250} />
                                </div>
                            </div>
                            <div className="glass rounded-[2.5rem] p-8 border border-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Efficiency Matrix</h3>
                                <div className="h-[250px]">
                                    <CostPerCreditChart data={projections[0]} height={250} />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
