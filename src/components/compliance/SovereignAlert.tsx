'use client';

import React from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

export function SovereignAlert({ message, policySlug }: { message: string; policySlug?: string }) {
    const [visible, setVisible] = React.useState(true);
    const url = policySlug ? `http://localhost:3003/policies/${policySlug}` : 'http://localhost:3003';
    if (!visible) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9998] w-full max-w-xl px-4">
            <div className="bg-black/80 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative">
                <div className="absolute bottom-0 left-0 h-0.5 bg-amber-500 w-1/3 animate-pulse" />
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-500 shrink-0">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Sovereign_Advisory</span>
                        <p className="text-xs text-white/80 font-medium truncate">{message}</p>
                    </div>
                    <a href={url} target="_blank" rel="noopener noreferrer"
                       className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 whitespace-nowrap">
                        Remediate <ArrowRight size={10} />
                    </a>
                    <button onClick={() => setVisible(false)} className="p-2 text-white/20 hover:text-white"><X size={16} /></button>
                </div>
            </div>
        </div>
    );
}
