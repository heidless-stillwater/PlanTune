'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import {
    TrendingUp,
    Zap,
    BarChart3,
    Shield,
    ArrowRight,
    Sparkles,
    LineChart,
    Target,
    Globe,
    ChevronRight,
    CreditCard,
    Brain,
} from 'lucide-react';

const FEATURES = [
    {
        icon: LineChart,
        title: 'Strategy Modelling',
        description: 'Compare up to 4 pricing strategies side-by-side with projections up to 5 years.',
    },
    {
        icon: Target,
        title: 'Smart Recommendations',
        description: 'AI-powered plan recommendations with pros, cons, and cost-per-credit breakdowns.',
    },
    {
        icon: Zap,
        title: 'Interactive Tuner',
        description: 'Drag sliders, twist dials — get instant visual feedback on every pricing change.',
    },
    {
        icon: Brain,
        title: 'Research Centre',
        description: 'Build a Centre of Excellence for credit management with Deep Research integration.',
    },
    {
        icon: Globe,
        title: 'Market Arbitrage',
        description: 'Track pricing across Gemini, OpenAI, Anthropic, Midjourney & Stability AI.',
    },
    {
        icon: Shield,
        title: 'Suite Integrated',
        description: 'Full integration with PromptTool, PromptResources, and the entire App Suite.',
    },
];

const STATS = [
    { value: '5', label: 'AI Providers Tracked' },
    { value: '∞', label: 'Scenarios (Pro)' },
    { value: '5yr', label: 'Max Projection' },
    { value: '$0', label: 'Free Tier' },
];

export default function LandingPage() {
    const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
    const { user, profile, signInWithGoogle } = useAuth();
    const router = useRouter();

    const handleAuthAction = async () => {
        try {
            if (user) {
                router.push('/dashboard');
            } else {
                await signInWithGoogle();
                // Redirect to dashboard after successful sign-in is handled in onAuthStateChanged
                // but we can explicitly push here too if sign-in completes.
                if (auth.currentUser) {
                    router.push('/dashboard');
                }
            }
        } catch (err: any) {
            console.error('[Landing] Auth action failed:', err);
            alert(`Login failed: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Navigation */}
            <nav className="glass-strong sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                             style={{ background: 'var(--gradient-brand)' }}>
                            <TrendingUp size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold gradient-text">PlanTune</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">Features</a>
                        <Link href="/pricing" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">Pricing</Link>
                        <a href="#providers" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">Providers</a>
                        <div className="h-4 w-px bg-white/10" />
                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-semibold text-[var(--foreground)] leading-none mb-1">
                                        {profile?.displayName || user.displayName || 'User'}
                                    </span>
                                    <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider">
                                        {profile?.subscription || 'Free'}
                                    </span>
                                </div>
                                <div className="w-9 h-9 rounded-full border-2 border-[var(--border-accent)] overflow-hidden">
                                    {profile?.photoURL || user.photoURL ? (
                                        <img 
                                            src={profile?.photoURL || user.photoURL || ''} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[var(--background-tertiary)] flex items-center justify-center">
                                            <TrendingUp size={14} className="text-[var(--primary-light)]" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleAuthAction}
                                    className="btn-primary text-xs px-4 py-2"
                                >
                                    Dashboard
                                </button>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={handleAuthAction}
                                    className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={handleAuthAction}
                                    className="btn-primary text-sm flex items-center gap-2"
                                    id="nav-get-started"
                                >
                                    Get Started <ArrowRight size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative overflow-hidden">
                {/* Background glow orbs */}
                <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
                     style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.4), transparent)' }} />
                <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
                     style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.4), transparent)' }} />

                <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-accent)] bg-[var(--background-secondary)] text-sm text-[var(--primary-light)] mb-8 animate-fade-in">
                            <Sparkles size={14} />
                            Now tracking NanoBanana Gemini Tokens
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 animate-slide-up">
                            Master Your{' '}
                            <span className="gradient-text">AI Credit</span>{' '}
                            Strategy
                        </h1>

                        <p className="text-lg md:text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto mb-10 animate-slide-up"
                           style={{ animationDelay: '0.1s' }}>
                            Model, compare, and optimise your credit consumption across AI providers.
                            Get data-driven recommendations that save you money — backed by hard numbers.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
                             style={{ animationDelay: '0.2s' }}>
                            <button onClick={handleAuthAction} className="btn-primary text-lg px-8 py-4 flex items-center gap-3" id="hero-cta">
                                <CreditCard size={20} />
                                {user ? 'View Dashboard' : 'Start Optimising — Free'}
                                <ArrowRight size={18} />
                            </button>
                            <Link href="/modeller" className="btn-secondary text-lg px-8 py-4 flex items-center gap-3" id="hero-demo">
                                <BarChart3 size={20} />
                                View Demo
                            </Link>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-slide-up"
                         style={{ animationDelay: '0.3s' }}>
                        {STATS.map((stat, i) => (
                            <div key={i} className="metric-card text-center">
                                <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
                                <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Everything You Need to{' '}
                            <span className="gradient-text">Optimise Credits</span>
                        </h2>
                        <p className="text-[var(--foreground-muted)] text-lg max-w-2xl mx-auto">
                            From real-time tracking to 5-year projections — all anchored in hard numbers with premium visualisations.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((feature, i) => (
                            <div
                                key={i}
                                className="metric-card card-hover cursor-default"
                                onMouseEnter={() => setHoveredFeature(i)}
                                onMouseLeave={() => setHoveredFeature(null)}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                                    hoveredFeature === i
                                        ? 'glow-teal'
                                        : ''
                                }`}
                                     style={{ background: hoveredFeature === i ? 'var(--gradient-brand)' : 'var(--background-tertiary)' }}>
                                    <feature.icon size={22} className={hoveredFeature === i ? 'text-white' : 'text-[var(--primary-light)]'} />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Providers */}
            <section id="providers" className="py-24 border-t border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Track <span className="gradient-text">5 Major Providers</span>
                        </h2>
                        <p className="text-[var(--foreground-muted)] text-lg">
                            Real-time pricing data and arbitrage opportunities across the AI landscape.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { name: 'Gemini', tag: 'Primary' },
                            { name: 'OpenAI', tag: 'GPT-4' },
                            { name: 'Anthropic', tag: 'Claude' },
                            { name: 'Midjourney', tag: 'Images' },
                            { name: 'Stability AI', tag: 'SDXL' },
                        ].map((provider, i) => (
                            <div key={i} className="metric-card card-hover text-center group">
                                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                                     style={{ background: 'var(--background-tertiary)' }}>
                                    <Globe size={24} className="text-[var(--primary-light)] group-hover:text-[var(--accent-light)] transition-colors" />
                                </div>
                                <h4 className="font-semibold text-sm">{provider.name}</h4>
                                <span className="text-xs text-[var(--foreground-muted)]">{provider.tag}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="glass rounded-3xl p-12 text-center glow-teal animate-pulse-glow">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to <span className="gradient-text">Optimise</span> Your Credits?
                        </h2>
                        <p className="text-[var(--foreground-muted)] text-lg mb-8 max-w-xl mx-auto">
                            Join the suite. Start with the free tier — upgrade when the numbers tell you to.
                        </p>
                        <button onClick={handleAuthAction} className="btn-primary text-lg px-10 py-4 flex items-center gap-3 mx-auto" id="cta-final">
                            {user ? 'Go to Dashboard' : 'Get Started Free'}
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[var(--border)] py-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={18} className="text-[var(--primary)]" />
                        <span className="font-semibold gradient-text">PlanTune</span>
                        <span className="text-sm text-[var(--foreground-muted)]">· Part of the Prompt App Suite</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
                        <a href="#" className="hover:text-[var(--foreground)] transition-colors">PromptTool</a>
                        <a href="#" className="hover:text-[var(--foreground)] transition-colors">Resources</a>
                        <a href="#" className="hover:text-[var(--foreground)] transition-colors">Accreditation</a>
                        <span>© 2026</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
