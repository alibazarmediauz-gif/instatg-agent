'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { getVoiceAnalyses, getVoiceAnalysis } from '@/lib/api';
import {
    Search, Mic, Clock, TrendingUp, AlertTriangle,
    Play, ChevronRight,
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────── */
interface VASummary {
    id: string;
    conversation_id: string;
    transcription: string;
    duration_seconds: number;
    tone: string;
    emotion: string;
    pain_points: string[];
    sale_outcome_reason: string;
    sales_moment_analysis: string;
    created_at: string;
}

interface VADetail extends VASummary {
    raw_analysis: any;
}

export default function VoiceAnalysisPage() {
    const { tenantId } = useTenant();

    const [analyses, setAnalyses] = useState<VASummary[]>([]);
    const [selected, setSelected] = useState<VADetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const res = await getVoiceAnalyses(tenantId) as { analyses: VASummary[] };
                setAnalyses(res.analyses || []);
                if ((res.analyses?.length ?? 0) > 0) {
                    loadDetail(res.analyses[0].id);
                }
            } catch (e) {
                console.error('Failed to load voice analyses:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [tenantId]);

    async function loadDetail(id: string) {
        try {
            const detail = await getVoiceAnalysis(id, tenantId) as VADetail;
            setSelected(detail);
        } catch (e) {
            console.error('Failed to load voice analysis detail:', e);
        }
    }

    const formatDuration = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const filteredAnalyses = searchQuery
        ? analyses.filter(a => a.transcription.toLowerCase().includes(searchQuery.toLowerCase()) || a.tone.toLowerCase().includes(searchQuery.toLowerCase()))
        : analyses;

    return (
        <div className="page-container animate-in" style={{ display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: 0, height: 'calc(100vh - 80px)', padding: 0, overflow: 'hidden' }}>
            {/* Left: Voice List */}
            <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                        <Search size={14} color="var(--text-muted)" />
                        <input type="text" placeholder="Search transcripts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            style={{ border: 'none', background: 'none', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: '100%' }} />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
                    ) : filteredAnalyses.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No voice analyses found</div>
                    ) : filteredAnalyses.map(a => (
                        <div key={a.id} onClick={() => loadDetail(a.id)}
                            style={{
                                padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                                background: selected?.id === a.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                                borderLeft: selected?.id === a.id ? '3px solid var(--accent)' : '3px solid transparent',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <Mic size={13} color="var(--accent)" />
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{a.tone.charAt(0).toUpperCase() + a.tone.slice(1)} tone</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatDuration(a.duration_seconds)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {a.transcription.slice(0, 100)}...
                            </div>
                            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>{a.emotion}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Center: Transcript */}
            <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>
                {selected ? (
                    <>
                        {/* Audio Player Placeholder */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <Play size={16} />
                                </button>
                                <div style={{ flex: 1 }}>
                                    {/* Waveform Bars */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 32 }}>
                                        {Array.from({ length: 40 }).map((_, i) => (
                                            <div key={i} style={{
                                                width: 3, borderRadius: 2,
                                                height: `${Math.random() * 28 + 4}px`,
                                                background: i < 15 ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                                                transition: 'height 0.2s',
                                            }} />
                                        ))}
                                    </div>
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDuration(selected.duration_seconds)}</span>
                            </div>
                        </div>

                        {/* Transcript */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Transcript</h3>
                            {selected.transcription.split('\n\n').map((block, i) => (
                                <div key={i} style={{
                                    marginBottom: 16, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                                    background: i % 2 === 0 ? 'var(--bg-elevated)' : 'transparent',
                                    borderLeft: i % 2 === 0 ? '3px solid var(--accent)' : '3px solid rgba(139,92,246,0.5)',
                                }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                                        <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                        {formatDuration(i * Math.floor(selected.duration_seconds / Math.max(selected.transcription.split('\n\n').length, 1)))}
                                        <span style={{ marginLeft: 8, color: i % 2 === 0 ? 'var(--accent)' : '#a78bfa' }}>
                                            {i % 2 === 0 ? '🎤 Sales Rep' : '👤 Prospect'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                                        {highlightKeywords(block, selected.pain_points)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Select a voice analysis</div>
                )}
            </div>

            {/* Right: AI Analysis */}
            <div style={{ overflowY: 'auto', padding: 16 }}>
                {selected ? (
                    <>
                        {/* Lead Qualification Score */}
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>LEAD QUALIFICATION</div>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                <div>
                                    <div style={{ fontSize: 28, fontWeight: 900 }}>8.5</div>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>/10</div>
                                </div>
                            </div>
                        </div>

                        {/* Sentiment Analysis */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>SENTIMENT ANALYSIS</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 20 }}>
                                    {selected.emotion.includes('optimistic') || selected.emotion.includes('excited') ? '😊' :
                                        selected.emotion.includes('reluctant') || selected.emotion.includes('hesitant') ? '😐' : '🤔'}
                                </span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.tone.charAt(0).toUpperCase() + selected.tone.slice(1)}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selected.emotion}</div>
                                </div>
                            </div>
                        </div>

                        {/* Key Pain Points */}
                        {selected.pain_points.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>KEY PAIN POINTS</div>
                                {selected.pain_points.map((p, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                                        <AlertTriangle size={12} color="var(--warning)" />
                                        <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Why the Sale Happened */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                                <TrendingUp size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                WHY THE SALE HAPPENED
                            </div>
                            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 14, fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                                {selected.sale_outcome_reason}
                            </div>
                        </div>

                        {/* Sales Moment Analysis */}
                        {selected.sales_moment_analysis && (
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                                    KEY SALES MOMENT
                                </div>
                                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)', padding: 14, fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                                    💡 {selected.sales_moment_analysis}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40 }}>Select a voice analysis</div>
                )}
            </div>
        </div>
    );
}

function highlightKeywords(text: string, keywords: string[]) {
    if (!keywords || keywords.length === 0) return text;
    const parts = text.split(new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi'));
    return parts.map((part, i) =>
        keywords.some(k => k.toLowerCase() === part.toLowerCase())
            ? <mark key={i} style={{ background: 'rgba(245,158,11,0.25)', color: 'var(--warning)', padding: '1px 4px', borderRadius: 3, fontWeight: 600 }}>{part}</mark>
            : part
    );
}
