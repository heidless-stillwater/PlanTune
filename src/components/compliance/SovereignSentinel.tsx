'use client';

import React from 'react';
import { useSovereignStatus } from '@/hooks/useSovereignStatus';
import { SovereignLock } from './SovereignLock';
import { SovereignAlert } from './SovereignAlert';
import { AgeVerificationModal } from './AgeVerificationModal';

export function SovereignSentinel() {
    const { gated, status, message, breachedPolicySlug } = useSovereignStatus();
    const [avVerified, setAvVerified] = React.useState(false);

    React.useEffect(() => {
        if (document.cookie.includes('stillwater_av_verified=true')) setAvVerified(true);
    }, []);

    if (gated && status === 'red') return <SovereignLock message={message} breachedPolicySlug={breachedPolicySlug} />;

    return (
        <>
            {status === 'amber' && message && <SovereignAlert message={message} policySlug={breachedPolicySlug} />}
            {!avVerified && <AgeVerificationModal onVerified={() => setAvVerified(true)} />}
        </>
    );
}
