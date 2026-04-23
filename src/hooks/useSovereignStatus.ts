'use client';

import { useState, useEffect } from 'react';

export interface SovereignStatus {
    gated: boolean;
    status: 'red' | 'amber' | 'green';
    message?: string;
    breachedPolicySlug?: string;
    loading: boolean;
    error: boolean;
}

export function useSovereignStatus() {
    const [status, setStatus] = useState<SovereignStatus>({
        gated: false, status: 'green', loading: true, error: false
    });

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch('/api/compliance/sovereign');
                const data = await res.json();
                setStatus({
                    gated: !!data.gated,
                    status: data.status || (data.gated ? 'red' : 'green'),
                    message: data.message,
                    breachedPolicySlug: data.breachedPolicySlug,
                    loading: false, error: false
                });
            } catch {
                setStatus(prev => ({ ...prev, loading: false, error: true }));
            }
        };
        check();
        const interval = setInterval(check, 60000);
        return () => clearInterval(interval);
    }, []);

    return status;
}
