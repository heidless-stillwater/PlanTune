'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Activity,
    TrendingUp,
    Zap,
    RotateCcw,
    ChevronRight,
    Save,
    Share2,
    DollarSign,
    Layers,
    BarChart3,
    Download,
    Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { createScenario } from '@/lib/services/scenario-service';
import { exportToCSV } from '@/lib/services/export-service';
import {
    SUBSCRIPTION_PLANS,
    type SubscriptionTier,
    type PricingScenario,
} from '@/lib/types';
import {
    generateProjection,
    getMonthlyCost,
    getTotalMonthlyCredits,
} from '@/lib/credit-models';
import {
    CumulativeCostChart,
    CreditBalanceChart,
} from '@/components/charts/ProjectionChart';

// ============================================
// Knob / Dial Component (Custom SVG)
// ============================================

interface DialProps {
    value: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
    label: string;
    unit?: string;
    color?: string;
}

function Dial({ value, min, max, onChange, label, unit = '', color = 'var(--primary)' }: DialProps) {
    const [isDragging, setIsDragging] = useState(false);
    
    const percentage = ((value - min) / (max - min)) * 100;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleMouseMove(e);
    };

    const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
        if (!isDragging && e.type === 'mousemove') return;
        
        const delta = (e as any).movementY * -1;
        const step = (max - min) / 100;
        const newValue = Math.min(max, Math.max(min, value + delta * step));
        onChange(Math.round(newValue));
    };

    useEffect(() => {
        const up = () => setIsDragging(false);
        window.addEventListener('mouseup', up);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mouseup', up);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [isDragging, value]);

    return (
        <div className="flex flex-col items-center gap-3 p-4 glass rounded-2xl group transition-all hover:bg-[var(--background-tertiary)]/40">
            <div className="relative w-24 h-24 flex items-center justify-center cursor-ns-resize"
                 onMouseDown={handleMouseDown}>
                <svg className="w-full h-full -rotate-90">
                    {/* Background Circle */}
                    <circle
                        cx="48" cy="48" r={radius}
                        className="stroke-[var(--border)] fill-none"
                        strokeWidth="8"
                    />
                    {/* Active Progress */}
                    <circle
                        cx="48" cy="48" r={radius}
                        stroke={color}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-300 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black font-mono tracking-tighter">{value}{unit}</span>
                </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors">
                {label}
            </div>
        </div>
    );
}

// ============================================
// Tuner Page
// ============================================

export default function TunerPage() {
    const { profile, loading } = useAuth();
    const currentTier = (profile?.subscription || 'free') as SubscriptionTier;

    const [usage, setUsage] = useState(250);
    const [growth, setGrowth] = useState(10);
    const [horizon, setHorizon] = useState(12);
    const [tier, setTier] = useState<SubscriptionTier>(currentTier);
    const [packStrategy, setPackStrategy] = useState<'none' | 'as-needed' | 'bulk-quarterly'>('none');

    // Sync tier with profile
    useEffect(() => {
        if (profile?.subscription) setTier(profile.subscription);
    }, [profile?.subscription]);

    const scenario: PricingScenario = useMemo(() => ({
        id: 'tuner-live',
        userId: profile?.uid || 'anonymous',
        name: 'Interactive Tune',
        useCase: 'tuning',
        tier: tier,
        monthlyUsage: usage,
        growthRate: growth,
        creditPackStrategy: packStrategy as any,
        customPacks: [],
        isPublic: false,
        createdAt: null,
        updatedAt: null,
    }), [tier, usage, growth, packStrategy, profile]);

    const projection = useMemo(() => generateProjection(scenario, horizon), [scenario, horizon]);
    
    const lastMonth = projection[projection.length - 1];
    const totalCost = lastMonth?.totalCost ?? 0;
    const efficiency = lastMonth ? totalCost / (lastMonth.creditsConsumed || 1) : 0;

    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

    const handleSave = useCallback(async () => {
        if (!profile?.uid) return;
        setSaveState('saving');
        try {
            await createScenario({
                userId: profile.uid,
                name: `Tuner — ${SUBSCRIPTION_PLANS[tier].name} @ ${usage}/mo`,
                useCase: 'tuning',
                tier,
                monthlyUsage: usage,
                growthRate: growth,
                creditPackStrategy: packStrategy,
                customPacks: [],
                isPublic: false,
            }, currentTier);
            setSaveState('saved');
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (err: any) {
            alert(err.message || 'Failed to save scenario');
            setSaveState('idle');
        }
    }, [profile, tier, usage, growth, packStrategy, currentTier]);

    const handleReset = () => {
        setUsage(250);
        setGrowth(10);
        setTier(currentTier);
        setPackStrategy('none');
        setHorizon(12);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#08080c] text-white selection:bg-[var(--primary)]/30">
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-y-auto">
                {/* Header */}
                <header className="glass-strong border-b border-white/5 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                                <Activity size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight uppercase">Interactive <span className="text-teal-400">Tuner</span></h1>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] -mt-1">Real-time Strategy Playground</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleReset} className="p-2 text-white/40 hover:text-white transition-colors" title="Reset">
                                <RotateCcw size={18} />
                            </button>
                            <button
                                onClick={() => exportToCSV(projection, `tuner_${tier}_${usage}`)}
                                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-black uppercase tracking-wider text-white/60 hover:text-white"
                            >
                                <Download size={14} /> CSV
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saveState === 'saving'}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-wider ${
                                    saveState === 'saved'
                                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                                }`}
                            >
                                {saveState === 'saved' ? <Check size={14} /> : <Save size={14} />}
                                {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved!' : 'Save Scenario'}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-12 gap-8 w-full">
                    {/* Left Column: Controls */}
                    <div className="lg:col-span-4 space-y-6">
                        <section>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4 px-1">Engine Parameters</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <Dial
                                    label="Initial Usage"
                                    unit=""
                                    min={0}
                                    max={5000}
                                    value={usage}
                                    onChange={setUsage}
                                    color="var(--primary-light)"
                                />
                                <Dial
                                    label="Growth Rate"
                                    unit="%"
                                    min={0}
                                    max={100}
                                    value={growth}
                                    onChange={setGrowth}
                                    color="var(--accent-light)"
                                />
                            </div>
                        </section>

                        <section className="glass rounded-3xl p-6 border border-white/5">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 px-1">Infrastructure Tier</h2>
                            <div className="space-y-2">
                                {(['free', 'standard', 'pro'] as SubscriptionTier[]).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTier(t)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                            tier === t
                                                ? 'bg-teal-500/10 border-teal-500/50 text-white'
                                                : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${tier === t ? 'bg-teal-400 animate-pulse' : 'bg-white/20'}`} />
                                            <span className="text-xs font-black uppercase tracking-widest">{SUBSCRIPTION_PLANS[t].name}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-white/40">${getMonthlyCost(t)}/mo</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="glass rounded-3xl p-6 border border-white/5">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 px-1">Pack Strategy</h2>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'none', label: 'Manual Only', desc: 'No automated purchases' },
                                    { id: 'as-needed', label: 'Just-in-Time', desc: 'Auto-buy optimal packs' },
                                    { id: 'bulk-quarterly', label: 'Bulk Reserve', desc: 'Quarterly forecasting' },
                                ].map((strat) => (
                                    <button
                                        key={strat.id}
                                        onClick={() => setPackStrategy(strat.id as any)}
                                        className={`flex flex-col items-start p-4 rounded-2xl border transition-all ${
                                            packStrategy === strat.id
                                                ? 'bg-amber-500/10 border-amber-500/50 text-white'
                                                : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-widest mb-1">{strat.label}</span>
                                        <span className="text-[10px] text-white/30 font-medium uppercase">{strat.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Visualization */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Real-time Telemetry */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 text-teal-400 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <DollarSign size={16} />
                                </div>
                                <div className="text-2xl font-black font-mono mb-1 text-teal-400">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Total Projected Cost</div>
                            </div>
                            <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 text-emerald-400 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <Layers size={16} />
                                </div>
                                <div className="text-2xl font-black font-mono mb-1 text-emerald-400">{lastMonth?.creditBalance.toLocaleString() || 0}</div>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">End Balance</div>
                            </div>
                            <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 text-amber-400 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <TrendingUp size={16} />
                                </div>
                                <div className="text-2xl font-black font-mono mb-1 text-amber-400">${efficiency.toFixed(3)}</div>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Cost Per Credit</div>
                            </div>
                            <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 text-rose-400 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <BarChart3 size={16} />
                                </div>
                                <div className="text-2xl font-black font-mono mb-1 text-rose-400">{horizon}mo</div>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Time Horizon</div>
                            </div>
                        </div>

                        {/* Primary Graph */}
                        <div className="glass rounded-[2rem] p-8 border border-white/10 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">Projection Analysis</h3>
                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-1">Cumulative Cost vs Credit Burn</p>
                                </div>
                                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                                    {[3, 6, 12, 24].map((h) => (
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
                            </div>
                            
                            <div className="h-[400px]">
                                <CumulativeCostChart 
                                    data={projection} 
                                    height={400} 
                                />
                            </div>
                        </div>

                        {/* Secondary Graph */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="glass rounded-[2rem] p-6 border border-white/5">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Credit Inventory</h4>
                                <div className="h-[200px]">
                                    <CreditBalanceChart data={projection} height={200} />
                                </div>
                            </div>
                            <div className="glass rounded-[2rem] p-6 border border-white/5 flex flex-col justify-center text-center">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 uppercase">System Health</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Gating Status</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Nominal</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Engine Version</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Sovereign 1.2.0</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Computation</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Edge-Verified</span>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-white/5">
                                        <button className="w-full btn-primary !rounded-2xl flex items-center justify-center gap-2 py-4">
                                            Export Detailed Analysis <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
