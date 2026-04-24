'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Plus,
    BookOpen,
    Clock,
    User,
    ArrowUpRight,
    Sparkles,
    ChevronRight,
    Link as LinkIcon,
    FileText,
    Globe,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { ArticleEditorModal } from '@/components/research/ArticleEditorModal';
import {
    SUBSCRIPTION_PLANS,
    type SubscriptionTier,
    type ResearchArticle,
} from '@/lib/types';
import {
    subscribeToArticles,
    createArticle,
} from '@/lib/services/research-service';

// ============================================
// Mock Data
// ============================================

const INITIAL_ARTICLES: ResearchArticle[] = [
    {
        id: 'r1',
        userId: 'admin-1',
        title: 'Gemini 1.5 Token Economics: A Deep Dive',
        summary: 'Analyzing the shift from character-based to token-based pricing in NanoBanana models and the impact on creator margins.',
        content: '',
        sources: [{ url: 'https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/', title: 'Google Blog', fetchedAt: null }],
        tags: ['Gemini', 'Pricing', 'Analysis'],
        visibility: 'published',
        version: 1,
        createdAt: null,
        updatedAt: null,
    },
    {
        id: 'r2',
        userId: 'admin-1',
        title: 'OpenAI GPT-4o Mini vs Gemini Flash 2.0',
        summary: 'Side-by-side efficiency comparison for batch processing tasks. Which provider offers the lowest latency-to-cost ratio?',
        content: '',
        sources: [],
        tags: ['Comparison', 'OpenAI', 'Gemini'],
        visibility: 'published',
        version: 2,
        createdAt: null,
        updatedAt: null,
    },
    {
        id: 'r3',
        userId: 'user-1',
        title: 'Arbitrage Strategy: Multi-Cloud Token Pooling',
        summary: 'How to distribute generation tasks across providers to maximize free-tier daily allowances while maintaining QoS.',
        content: '',
        sources: [],
        tags: ['Strategy', 'Arbitrage'],
        visibility: 'published',
        version: 1,
        createdAt: null,
        updatedAt: null,
    },
];

// ============================================
// Article Card
// ============================================

function ArticleCard({ article }: { article: ResearchArticle }) {
    return (
        <div className="glass rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all group cursor-pointer hover:bg-white/[0.02]">
            <div className="flex items-start justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                    {article.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-white/5 rounded-lg text-white/40 group-hover:text-white/60 transition-colors">
                            {tag}
                        </span>
                    ))}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Read Analysis <ArrowUpRight size={12} />
                </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-400 transition-colors leading-tight">{article.title}</h3>
            <p className="text-xs text-white/40 leading-relaxed mb-6 line-clamp-2">{article.summary}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                    <User size={12} />
                    <span>Sovereign Analyst</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                    <Clock size={12} />
                    <span>2 days ago</span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Research Page
// ============================================

export default function ResearchPage() {
    const { profile, loading } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const [articles, setArticles] = useState<ResearchArticle[]>(INITIAL_ARTICLES);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorMode, setEditorMode] = useState<'import' | 'manual'>('manual');

    // Subscribe to Firestore articles in real time
    useEffect(() => {
        if (!profile?.uid) return;
        const unsubscribe = subscribeToArticles(profile.uid, (dbArticles) => {
            if (dbArticles.length > 0) {
                setArticles(dbArticles);
            }
            // If no Firestore articles, keep the initial seed data
        });

        return () => unsubscribe();
    }, [profile?.uid]);

    const currentTier = (profile?.subscription || 'free') as SubscriptionTier;
    const canCreate = currentTier === 'standard' || currentTier === 'pro';

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        articles.forEach(a => a.tags.forEach(t => tags.add(t)));
        return Array.from(tags);
    }, [articles]);

    const filteredArticles = useMemo(() => {
        return articles.filter(a => {
            const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 a.summary.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = !activeTag || a.tags.includes(activeTag);
            return matchesSearch && matchesTag;
        });
    }, [searchQuery, activeTag, articles]);

    const handleSaveArticle = async (newArticleData: Partial<ResearchArticle>) => {
        if (profile?.uid) {
            // Persist to Firestore — the subscription will update local state
            try {
                await createArticle(profile.uid, {
                    userId: profile.uid,
                    title: newArticleData.title || 'Untitled',
                    content: newArticleData.content || '',
                    summary: newArticleData.summary || '',
                    sources: newArticleData.sources || [],
                    tags: newArticleData.tags || [],
                    visibility: newArticleData.visibility || 'private',
                    version: 1,
                });
            } catch (err) {
                console.error('Failed to save article:', err);
            }
        } else {
            // Offline fallback
            const newArticle: ResearchArticle = {
                id: `r${Date.now()}`,
                userId: 'anon',
                title: newArticleData.title || 'Untitled',
                content: newArticleData.content || '',
                summary: newArticleData.summary || '',
                sources: newArticleData.sources || [],
                tags: newArticleData.tags || [],
                visibility: newArticleData.visibility || 'private',
                version: 1,
                createdAt: null as any,
                updatedAt: null as any,
            };
            setArticles([newArticle, ...articles]);
        }
    };

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
                {/* Header */}
                <header className="glass-strong border-b border-white/5 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <BookOpen size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight uppercase">Research <span className="text-indigo-400">Hub</span></h1>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] -mt-1">Centre of Excellence</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => { setEditorMode('import'); setIsEditorOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-black uppercase tracking-wider text-white/60 hover:text-white"
                            >
                                <LinkIcon size={14} /> Import URL
                            </button>
                            {canCreate && (
                                <button 
                                    onClick={() => { setEditorMode('manual'); setIsEditorOpen(true); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 rounded-xl transition-all text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20"
                                >
                                    <Plus size={14} /> Create Article
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-6 py-12 w-full">
                    {/* Hero / Search */}
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                            <Sparkles size={14} /> Knowledge Sovereign Nodes Active
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Master the <span className="text-indigo-400">Token</span> Economy</h2>
                        <p className="text-white/40 text-sm font-medium leading-relaxed mb-10">
                            Deep research, pricing analysis, and arbitrage strategies verified by the App Suite ecosystem.
                        </p>
                        
                        <div className="relative group max-w-xl mx-auto">
                            <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-indigo-400 transition-colors">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search research database..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all font-medium text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                        <button
                            onClick={() => setActiveTag(null)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTag === null ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
                            }`}
                        >
                            All Articles
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTag === tag ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredArticles.map(article => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                        
                        {/* Upsell Card if not Pro */}
                        {currentTier !== 'pro' && (
                            <div className="glass rounded-3xl p-6 border border-dashed border-white/10 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-indigo-500/30 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-white/20 group-hover:text-indigo-400 transition-colors">
                                    <Sparkles size={24} />
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-widest mb-2">Deep Research</h4>
                                <p className="text-[10px] text-white/40 font-medium uppercase leading-relaxed mb-6">
                                    Unlock AI-generated deep dives and competitive market intel.
                                </p>
                                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Upgrade to Pro <ChevronRight size={12} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Empty State */}
                    {filteredArticles.length === 0 && (
                        <div className="text-center py-24">
                            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6 text-white/10">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No results found</h3>
                            <p className="text-xs text-white/40">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </main>

                {/* Footer / Meta */}
                <footer className="border-t border-white/5 py-12 mt-12 bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 text-center md:text-left">
                        <div>
                            <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                                <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
                                    <Globe size={14} className="text-white" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Global Intel Nodes</span>
                            </div>
                            <p className="text-[10px] text-white/30 font-medium uppercase leading-relaxed">
                                Market pricing data is aggregated from public endpoints and verified daily at 00:00 UTC.
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                                <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Gemini 2.5 Pro Powered</span>
                            </div>
                            <p className="text-[10px] text-white/30 font-medium uppercase leading-relaxed">
                                Deep Research integration utilizes high-context reasoning to detect market shifts and arbitrage leaks.
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                                <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
                                    <User size={14} className="text-white" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Contributor Protocol</span>
                            </div>
                            <p className="text-[10px] text-white/30 font-medium uppercase leading-relaxed">
                                Standard and Pro users can publish research subject to admin moderation for community-wide discovery.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>

            <ArticleEditorModal 
                isOpen={isEditorOpen} 
                onClose={() => setIsEditorOpen(false)} 
                initialMode={editorMode}
                onSave={handleSaveArticle}
            />
        </div>
    );
}
