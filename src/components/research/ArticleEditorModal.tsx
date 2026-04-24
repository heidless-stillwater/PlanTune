import React, { useState } from 'react';
import { X, Link as LinkIcon, Edit3, Sparkles, Loader2, Save } from 'lucide-react';
import type { ResearchArticle } from '@/lib/types';

interface ArticleEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'import' | 'manual';
    article?: Partial<ResearchArticle>;
    onSave: (article: Partial<ResearchArticle>) => void;
}

export function ArticleEditorModal({ isOpen, onClose, initialMode = 'manual', article, onSave }: ArticleEditorModalProps) {
    const [mode, setMode] = useState<'import' | 'manual'>(initialMode);
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [title, setTitle] = useState(article?.title || '');
    const [summary, setSummary] = useState(article?.summary || '');
    const [content, setContent] = useState(article?.content || '');
    const [tags, setTags] = useState(article?.tags?.join(', ') || '');

    if (!isOpen) return null;

    const handleImport = async () => {
        if (!url) return;
        setLoading(true);
        
        try {
            const res = await fetch('/api/ai/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to analyze URL');
            }
            
            setTitle(data.title || '');
            setSummary(data.summary || '');
            setContent(data.content || '');
            setTags((data.tags || []).join(', '));
            
            // Switch to manual mode so the user can review and edit before saving
            setMode('manual');
        } catch (err: any) {
            alert(err.message || 'An error occurred during ingestion.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        onSave({
            title,
            summary,
            content,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            sources: url ? [{ url, title: 'Imported Source', fetchedAt: null }] : [],
            visibility: 'private'
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-strong w-full max-w-2xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                        {mode === 'import' ? <LinkIcon size={16} className="text-indigo-400" /> : <Edit3 size={16} className="text-purple-400" />}
                        {mode === 'import' ? 'Import from URL' : 'Article Editor'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-white/[0.01]">
                    <button 
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${mode === 'manual' ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5' : 'text-white/40 hover:text-white/60'}`}
                        onClick={() => setMode('manual')}
                    >
                        Manual Entry
                    </button>
                    <button 
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${mode === 'import' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-white/40 hover:text-white/60'}`}
                        onClick={() => setMode('import')}
                    >
                        AI Import
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 h-[400px] overflow-y-auto">
                    {mode === 'import' ? (
                        <div className="space-y-6 flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2 border border-indigo-500/20">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white mb-2">Knowledge Ingestion</h3>
                                <p className="text-xs text-white/40 max-w-xs mx-auto">
                                    Paste a URL below. Our AI will extract the content, generate a summary, and identify key strategies.
                                </p>
                            </div>
                            <div className="w-full max-w-md space-y-4">
                                <input
                                    type="url"
                                    placeholder="https://example.com/article"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all text-white"
                                />
                                <button 
                                    onClick={handleImport}
                                    disabled={!url || loading}
                                    className="w-full btn-primary !bg-indigo-500 hover:!bg-indigo-400 !rounded-2xl py-3 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    {loading ? 'Analyzing...' : 'Analyze & Import'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Gemini Token Economics"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="e.g. Analysis, Gemini, Tokens"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Executive Summary</label>
                                <textarea
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all text-white resize-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Full Content</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={6}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all text-white resize-none font-mono"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {mode === 'manual' && (
                    <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl transition-all text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/20">
                            <Save size={14} /> Save Article
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
