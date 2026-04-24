'use client';

import React, { useState } from 'react';
import {
    Settings,
    User,
    Bell,
    CreditCard,
    Shield,
    Database,
    LogOut,
    ChevronRight,
    CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { SUBSCRIPTION_PLANS, type SubscriptionTier } from '@/lib/types';

export default function SettingsPage() {
    const { profile, loading, signOut } = useAuth();
    const [activeSection, setActiveSection] = useState('profile');

    const currentTier = (profile?.subscription || 'free') as SubscriptionTier;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    const sections = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'data', label: 'Data & Privacy', icon: Database },
    ];

    return (
        <div className="flex min-h-screen bg-[#08080c] text-white">
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-y-auto">
                <header className="glass-strong border-b border-white/5 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                <Settings size={20} className="text-white/40" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight uppercase">Settings</h1>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] -mt-1">Account & Preferences</p>
                            </div>
                        </div>
                        <button
                            onClick={signOut}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all text-xs font-black uppercase tracking-wider text-rose-400"
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-12 w-full">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-3 space-y-2">
                        {sections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all border ${
                                    activeSection === section.id
                                        ? 'bg-white/10 border-white/10 text-white'
                                        : 'bg-transparent border-transparent text-white/40 hover:bg-white/5 hover:text-white/60'
                                }`}
                            >
                                <section.icon size={18} />
                                <span className="text-sm font-black uppercase tracking-widest">{section.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        <div className="glass rounded-[2.5rem] p-10 border border-white/5 min-h-[600px]">
                            {activeSection === 'profile' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">Identity <span className="text-teal-400">Profile</span></h2>
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-6 p-6 glass rounded-3xl border border-white/5">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-3xl font-black">
                                                {profile?.displayName?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="text-xl font-black mb-1">{profile?.displayName || 'User'}</div>
                                                <div className="text-sm text-white/30 font-medium">{profile?.email}</div>
                                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40">
                                                    Role: {profile?.role || 'Member'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Display Name</label>
                                                <input
                                                    type="text"
                                                    defaultValue={profile?.displayName || ''}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-teal-500/50 transition-all font-medium text-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Username</label>
                                                <input
                                                    type="text"
                                                    defaultValue={profile?.username || ''}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-teal-500/50 transition-all font-medium text-white"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="pt-6">
                                            <button className="btn-primary !rounded-2xl px-8 py-4">Save Changes</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'billing' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">Billing <span className="text-amber-400">& Plans</span></h2>
                                    <div className="space-y-6">
                                        <div className="p-8 glass rounded-3xl border border-amber-500/20 bg-amber-500/5 relative overflow-hidden group">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-1">Current Plan</div>
                                                    <div className="text-3xl font-black uppercase tracking-tight">{SUBSCRIPTION_PLANS[currentTier]?.name || 'Free'}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black font-mono">${((SUBSCRIPTION_PLANS[currentTier]?.price || 0) / 100).toFixed(2)}</div>
                                                    <div className="text-[10px] text-white/30 font-black uppercase tracking-widest">Per Month</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-8">
                                                {(SUBSCRIPTION_PLANS[currentTier]?.features || []).map((f, i) => (
                                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl text-[10px] font-medium text-white/60">
                                                        <CheckCircle2 size={12} className="text-amber-400" /> {f}
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
                                                Manage Subscription <ChevronRight size={16} />
                                            </button>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-6 glass rounded-3xl border border-white/5">
                                                <h3 className="text-sm font-black uppercase tracking-widest mb-4">Payment Method</h3>
                                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[8px] font-black">VISA</div>
                                                    <div className="text-xs font-mono text-white/60">•••• •••• •••• 4242</div>
                                                </div>
                                            </div>
                                            <div className="p-6 glass rounded-3xl border border-white/5">
                                                <h3 className="text-sm font-black uppercase tracking-widest mb-4">Suite Entitlements</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {['PlanTune', 'PromptTool', 'Resources'].map(app => (
                                                        <span key={app} className="px-2 py-1 bg-teal-500/10 text-teal-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-teal-500/20">
                                                            {app} Active
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection !== 'profile' && activeSection !== 'billing' && (
                                <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-in fade-in duration-500">
                                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 text-white/10">
                                        <Settings size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{sections.find(s => s.id === activeSection)?.label} Settings</h3>
                                    <p className="text-xs text-white/40 max-w-xs mx-auto">This section is currently under clinical verification. Please check back soon.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
