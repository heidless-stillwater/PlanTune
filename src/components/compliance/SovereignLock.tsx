'use client';

import React from 'react';

interface SovereignLockProps { message?: string; breachedPolicySlug?: string; }

export function SovereignLock({ message, breachedPolicySlug }: SovereignLockProps) {
    const defaultMsg = 'Access Restricted: Critical legislative drift detected. Remediate at the Accreditation Hub.';
    const url = breachedPolicySlug
        ? `http://localhost:3003/policies/${breachedPolicySlug}/wizard?remediate=true`
        : 'http://localhost:3003/admin/dashboard';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 sm:p-12">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
            <div className="relative max-w-2xl w-full bg-white/[0.03] border border-rose-500/30 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_0_100px_rgba(244,63,94,0.15)] overflow-hidden group text-center">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full animate-pulse" />
                <div className="relative flex flex-col items-center gap-8">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-20 animate-pulse" />
                        <div className="relative bg-black/40 border border-rose-500/40 p-6 rounded-3xl">
                            <svg className="w-16 h-16 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                        Sovereign <span className="text-rose-500">Lock</span> Active
                    </h2>
                    <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-2xl max-w-lg">
                        <p className="text-sm font-bold text-white/70 leading-relaxed uppercase tracking-wide">
                            {message || defaultMsg}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <a href={url} target="_blank" rel="noopener noreferrer"
                           className="bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-[0.3em] text-[10px] px-8 py-5 rounded-2xl transition-all">
                            Remediate Breach
                        </a>
                        <button onClick={() => window.location.reload()}
                                className="bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-black uppercase tracking-[0.3em] text-[10px] px-8 py-5 rounded-2xl border border-white/5 transition-all">
                            Re-Scan Registry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
