'use client';

import React, { useState } from 'react';
import { ShieldCheck, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

export function AgeVerificationModal({ onVerified }: { onVerified: () => void }) {
    const [dob, setDob] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dob) { setError('Please provide your date of birth.'); return; }
        const age = Math.abs(new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970);
        if (age < 18) { setError('You must be at least 18 years old.'); return; }
        setError(''); setSuccess(true);
        document.cookie = "stillwater_av_verified=true; path=/; max-age=2592000; samesite=lax";
        setTimeout(onVerified, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
            <div className="relative w-full max-w-md bg-slate-900/80 border border-slate-700/50 rounded-3xl p-8 shadow-2xl border-t-2 border-t-teal-500/50">
                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
                                <ShieldCheck className="w-8 h-8 text-teal-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Age Verification Required</h2>
                            <p className="text-sm text-slate-400">Online Safety Act 2023 compliance check.</p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Date of Birth</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)}
                                       className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-teal-500/50" />
                            </div>
                        </div>
                        {error && (
                            <div className="flex gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0" /><p>{error}</p>
                            </div>
                        )}
                        <button type="submit" className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]">
                            Verify & Enter Suite
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                            <CheckCircle2 className="w-10 h-10 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Access Granted</h2>
                        <p className="text-sm text-slate-400">Establishing secure analytics session...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
