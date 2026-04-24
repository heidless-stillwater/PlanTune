'use client';

import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    LineChart, 
    Target, 
    Activity, 
    Brain, 
    Globe, 
    CreditCard, 
    Settings, 
    TrendingUp,
    Zap,
    Menu,
    X,
    LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SuiteSwitcher } from './SuiteSwitcher';
import { useAuth } from '@/lib/auth-context';
import { SUBSCRIPTION_PLANS, type SubscriptionTier } from '@/lib/types';

interface NavItemProps {
    icon: any;
    label: string;
    href: string;
    active?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
}

function NavItem({ icon: Icon, label, href, active, collapsed, onClick }: NavItemProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                active
                    ? 'bg-[var(--primary-light)]/10 text-[var(--primary)] shadow-sm'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'
            }`}
            title={collapsed ? label : undefined}
        >
            <Icon size={18} className={`shrink-0 ${active ? 'text-[var(--primary)]' : 'group-hover:scale-110 transition-transform'}`} />
            {!collapsed && <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap">{label}</span>}
        </Link>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();
    const currentTier = (profile?.subscription || 'free') as SubscriptionTier;

    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileOpen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const navItems = (
        <>
            <NavItem icon={BarChart3} label="Dashboard" href="/dashboard" active={pathname === '/dashboard'} onClick={() => setMobileOpen(false)} />
            <NavItem icon={LineChart} label="Modeller" href="/modeller" active={pathname === '/modeller'} onClick={() => setMobileOpen(false)} />
            <NavItem icon={Target} label="Recommendations" href="/recommendations" active={pathname === '/recommendations'} onClick={() => setMobileOpen(false)} />
            <NavItem icon={Activity} label="Tuner" href="/tuner" active={pathname === '/tuner'} onClick={() => setMobileOpen(false)} />
            <NavItem icon={Brain} label="Research" href="/research" active={pathname === '/research'} onClick={() => setMobileOpen(false)} />
            <NavItem icon={Globe} label="Arbitrage" href="/arbitrage" active={pathname === '/arbitrage'} onClick={() => setMobileOpen(false)} />

            <div className="my-4 h-px bg-[var(--border)] opacity-50 mx-4" />

            <NavItem icon={CreditCard} label="Pricing & Packs" href="/pricing" active={pathname === '/pricing'} onClick={() => setMobileOpen(false)} />
            <NavItem icon={Settings} label="Settings" href="/settings" active={pathname === '/settings'} onClick={() => setMobileOpen(false)} />
        </>
    );

    const brandHeader = (
        <div className="flex items-center gap-3 px-4 py-4 mb-2">
            <SuiteSwitcher />
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-brand)' }}>
                    <TrendingUp size={16} className="text-white" />
                </div>
                <span className="text-base font-bold gradient-text tracking-tighter">PlanTune</span>
            </div>
        </div>
    );

    const logoutButton = (
        <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-400/10 mt-2"
        >
            <LogOut size={18} className="shrink-0" />
            <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap">Log Out</span>
        </button>
    );

    const userProfile = (
        <div className="px-4 py-3 border-t border-[var(--border)] mt-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[var(--border-accent)] overflow-hidden shrink-0">
                    {profile?.photoURL ? (
                        <img 
                            src={profile.photoURL} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="w-full h-full bg-[var(--background-tertiary)] flex items-center justify-center">
                            <TrendingUp size={16} className="text-[var(--primary-light)]" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-[var(--foreground)] truncate">
                        {profile?.displayName || 'User'}
                    </span>
                    <span className="text-[10px] text-[var(--foreground-muted)] truncate">
                        {profile?.email}
                    </span>
                </div>
            </div>
        </div>
    );

    const planBadge = (
        <div className="mt-auto flex flex-col">
            {userProfile}
            <div className="px-4 py-3 flex flex-col gap-2">
                <div className="metric-card !p-3 text-center !bg-white/5 border border-white/5">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-1">Active Plan</div>
                    <div className="text-xs font-black gradient-text uppercase tracking-widest">
                        {SUBSCRIPTION_PLANS[currentTier]?.name || 'Free'}
                    </div>
                </div>
                {logoutButton}
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Open navigation"
            >
                <Menu size={20} />
            </button>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 border-r border-[var(--border)] bg-[var(--background-secondary)] p-4 flex-col sticky top-0 h-screen shrink-0 overflow-hidden">
                {brandHeader}
                
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-1">
                    {navItems}
                </div>

                <div className="mt-auto flex flex-col pt-4 border-t border-[var(--border)]">
                    {userProfile}
                    <div className="mt-2 px-4 py-3 flex flex-col gap-2">
                        <div className="metric-card !p-3 text-center !bg-white/5 border border-white/5">
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-1">Active Plan</div>
                            <div className="text-xs font-black gradient-text uppercase tracking-widest">
                                {SUBSCRIPTION_PLANS[currentTier]?.name || 'Free'}
                            </div>
                        </div>
                        {logoutButton}
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-[70]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Drawer */}
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--background-secondary)] border-r border-[var(--border)] p-4 flex flex-col gap-2 overflow-y-auto animate-in slide-in-from-left duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-brand)' }}>
                                    <TrendingUp size={16} className="text-white" />
                                </div>
                                <span className="text-base font-bold gradient-text tracking-tighter">PlanTune</span>
                            </div>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                aria-label="Close navigation"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mb-2">
                            <SuiteSwitcher />
                        </div>

                        {navItems}
                        {planBadge}
                    </aside>
                </div>
            )}
        </>
    );
}
