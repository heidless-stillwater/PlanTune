'use client';

import React from 'react';
import {
    Globe,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    TrendingUp,
    Zap,
    Cpu,
    ShieldCheck,
    AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';

// ============================================
// Mock Data
// ============================================

const PROVIDER_DATA = [
    { id: 'gemini', name: 'NanoBanana Gemini', tokenPrice: 0.000015, change: -2.4, status: 'optimal', type: 'LLM' },
    { id: 'openai', name: 'OpenAI GPT-4o', tokenPrice: 0.000030, change: 0, status: 'stable', type: 'LLM' },
    { id: 'anthropic', name: 'Anthropic Claude 3.5', tokenPrice: 0.000025, change: +1.2, status: 'rising', type: 'LLM' },
    { id: 'midjourney', name: 'Midjourney v6', tokenPrice: 0.045, change: -10.5, status: 'discount', type: 'Image' },
    { id: 'stability', name: 'Stability AI SDXL', tokenPrice: 0.012, change: 0, status: 'stable', type: 'Image' },
];

const ARBITRAGE_OPPORTUNITIES = [
    { 
        title: 'Token Pooling: Gemini Flash', 
        description: 'Shift non-critical classification tasks to Gemini 2.0 Flash to save 45% vs GPT-4o mini.',
        impact: 'High',
        savings: '~$240/mo'
    },
    { 
        title: 'Off-Peak Batch Processing', 
        description: 'Midjourney credits are 15% cheaper during weekend maintenance windows.',
        impact: 'Medium',
        savings: '~$85/mo'
    }
];

// ============================================
// Page
// ============================================

export default function ArbitragePage() {
    const { loading } = useAuth();

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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Globe size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight uppercase">Market <span className="text-indigo-400">Arbitrage</span></h1>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] -mt-1">Cross-Provider Price Matrix</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-6 py-12 w-full space-y-12">
                    {/* Market Matrix */}
                    <section>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 px-1">Global Price Matrix</h2>
                        <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40">Provider</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40">Type</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40">Base Price</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40">24h Change</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/40"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PROVIDER_DATA.map((p) => (
                                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-indigo-400 transition-colors">
                                                        <Cpu size={16} />
                                                    </div>
                                                    <span className="text-sm font-bold">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-xs text-white/40 font-medium">{p.type}</td>
                                            <td className="px-8 py-6 text-xs font-mono">${p.tokenPrice.toFixed(6)}</td>
                                            <td className="px-8 py-6">
                                                <div className={`flex items-center gap-1 text-xs font-bold ${p.change < 0 ? 'text-emerald-400' : p.change > 0 ? 'text-rose-400' : 'text-white/20'}`}>
                                                    {p.change < 0 ? <ArrowDownRight size={14} /> : p.change > 0 ? <ArrowUpRight size={14} /> : <Minus size={14} />}
                                                    {Math.abs(p.change)}%
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                                                    p.status === 'optimal' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                                    p.status === 'rising' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                                                    p.status === 'discount' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                                                    'bg-white/5 border-white/10 text-white/40'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors">
                                                    Analysis
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Opportunities Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <section>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 px-1">Arbitrage Opportunities</h2>
                            <div className="space-y-4">
                                {ARBITRAGE_OPPORTUNITIES.map((opt, i) => (
                                    <div key={i} className="glass p-6 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                    <Zap size={18} />
                                                </div>
                                                <h3 className="text-sm font-bold">{opt.title}</h3>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                                                {opt.impact} Impact
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/40 leading-relaxed mb-6">{opt.description}</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Monthly Potential</span>
                                            <span className="text-sm font-black text-emerald-400 font-mono">{opt.savings}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 px-1">Market Sentiment</h2>
                            <div className="glass rounded-[2rem] p-8 border border-white/5 flex flex-col items-center justify-center text-center h-[calc(100%-3rem)]">
                                <div className="w-20 h-20 rounded-full bg-indigo-500/5 flex items-center justify-center mb-8 relative">
                                    <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping" />
                                    <ShieldCheck size={40} className="text-indigo-400 relative z-10" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 uppercase tracking-tight">System Nominal</h3>
                                <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto mb-8">
                                    All provider endpoints are responsive. No major pricing spikes detected in the last 12 hours.
                                </p>
                                <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                                    <AlertTriangle size={14} /> 1 Market Drift Alert
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
