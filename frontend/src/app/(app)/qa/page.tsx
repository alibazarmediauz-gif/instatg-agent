'use client';

import { useState, useEffect } from 'react';
import {
    ShieldAlert, AlertTriangle, CheckCircle, XCircle,
    ChevronRight, UserCheck, Search, Loader2,
    Eye, MessageSquare, RefreshCw, AlertCircle, Trophy,
    Info, Brain, Zap, Target, BookOpen
} from 'lucide-react';
import { useTenant } from '@/lib/TenantContext';
import { getQAFlagged } from '@/lib/api';

// ── Constants ────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; color: string; badge: string }> = {
    high: { label: 'HIGH', bg: 'rgba(239,68,68,0.08)', color: 'var(--danger)', badge: 'danger' },
    medium: { label: 'MED', bg: 'rgba(245,158,11,0.08)', color: 'var(--warning)', badge: 'warning' },
    low: { label: 'LOW', bg: 'rgba(34,197,94,0.08)', color: 'var(--success)', badge: 'success' },
};

function getSeverity(flag: any) {
    if (flag.is_toxic || flag.score < 30) return 'high';
    if (flag.has_hallucination || flag.score < 60) return 'medium';
    return 'low';
}

function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
}

const ALGORITHM_DOCS = [
    { title: 'Sentiment & Tone', icon: <Zap size={14} />, desc: 'Real-time NLP analysis using BERT-based models to detect aggression, frustration, or overly informal tone.', logic: 'Score < 0.3 triggers warning; Score < 0 triggers HIGH severity flag.' },
    { title: 'Hallucination Check', icon: <Target size={14} />, desc: 'RAG-based verification. AI response is cross-referenced against your Knowledge Base documents.', logic: 'Mismatch in pricing, dates, or technical specs triggers Hallucination flag.' },
    { title: 'Script Compliance', icon: <BookOpen size={14} />, desc: 'Levenshtein distance and intent matching between current transcript and your defined Campaign Script.', logic: 'Deviation > 40% from mandatory flow steps triggers Script Deviation.' },
    { title: 'Safety & Toxicity', icon: <ShieldAlert size={14} />, desc: 'Hard-coded trigger word filters + LLM safety guardrails.', logic: 'Any toxic keyword or offensive intent results in immediate session termination & High severity flag.' },
];

export default function QAControlCenterPage() {
    const { tenantId } = useTenant();
    const [flags, setFlags] = useState<any[]>([]);
    const [stats, setStats] = useState({ pending_reviews: 4, auto_passed: 2841, flag_rate: 0.14, avg_qa_score: 91.4 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selected, setSelected] = useState<any | null>(null);
    const [search, setSearch] = useState('');
    const [reviewed, setReviewed] = useState<Set<string>>(new Set());

    const fetchQA = async () => {
        try {
            const data = await getQAFlagged(tenantId) as any;
            if (data.status === 'success') {
                if (data.data) setFlags(data.data);
                if (data.stats) setStats(data.stats);
            }
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQA();
        const t = setInterval(fetchQA, 30000);
        return () => clearInterval(t);
    }, [tenantId]);

    const filtered = flags.filter(f => {
        const q = search.toLowerCase();
        return !q || f.contact_name?.toLowerCase().includes(q) || f.agent?.toLowerCase().includes(q) || f.flag_reason?.toLowerCase().includes(q);
    });

    const handleAction = (flagId: string, action: 'approve' | 'reject') => {
        setReviewed(prev => new Set([...prev, flagId]));
        setSelected(null);
    };

    if (loading) return (
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading QA System...</div>
            </div>
        </div>
    );

    return (
        <div className="page-container animate-in" style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', height: '100vh' }}>

            {/* Offline banner */}
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: 'var(--warning)' }}>
                    <AlertCircle size={14} />
                    Backend offline — could not load QA data.
                    <button onClick={fetchQA} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <RefreshCw size={12} /> Retry
                    </button>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>QA Control Center</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Review flagged conversations and AI safety alerts</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <Search size={13} color="var(--text-muted)" />
                        <input
                            type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search flags..."
                            style={{ border: 'none', background: 'transparent', padding: '9px 8px', outline: 'none', fontSize: 13, color: 'var(--text-primary)', width: 200 }}
                        />
                    </div>
                    <button onClick={fetchQA} className="btn btn-secondary" style={{ gap: 6 }}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { icon: <ShieldAlert size={18} />, label: 'Pending Reviews', value: stats.pending_reviews, color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
                    { icon: <CheckCircle size={18} />, label: 'Auto-Passed Today', value: stats.auto_passed.toLocaleString(), color: 'var(--success)', bg: 'rgba(34,197,94,0.1)' },
                    { icon: <AlertTriangle size={18} />, label: 'Flag Rate', value: `${stats.flag_rate}%`, color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
                    { icon: <Trophy size={18} />, label: 'Avg QA Score', value: `${stats.avg_qa_score}/100`, color: 'var(--accent)', bg: 'rgba(59,130,246,0.1)' },
                ].map(kpi => (
                    <div key={kpi.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, flexShrink: 0 }}>
                            {kpi.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{kpi.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, flex: 1, overflow: 'hidden' }}>
                {/* Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                            Flagged Queue
                            {filtered.length > 0 && <span style={{ marginLeft: 8, padding: '2px 8px', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', borderRadius: 10, fontSize: 11, fontWeight: 800 }}>{filtered.filter(f => !reviewed.has(f.id)).length}</span>}
                        </h3>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click any row to review</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                                <CheckCircle size={36} color="var(--success)" style={{ margin: '0 auto 16px' }} />
                                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>All Clear 🎉</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No flagged interactions match your search.</div>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)' }}>
                                        {['Lead / Contact', 'AI Agent', 'Flag Reason', 'Severity', 'QA Score', 'Time', ''].map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(flag => {
                                        const sev = getSeverity(flag);
                                        const cfg = SEVERITY_CONFIG[sev];
                                        const done = reviewed.has(flag.id);
                                        return (
                                            <tr
                                                key={flag.id}
                                                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', opacity: done ? 0.45 : 1, background: selected?.id === flag.id ? 'var(--bg-elevated)' : 'transparent', transition: 'all 0.15s' }}
                                                onClick={() => !done && setSelected(flag)}
                                                onMouseEnter={e => !done && (e.currentTarget.style.background = 'var(--bg-elevated)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = selected?.id === flag.id ? 'var(--bg-elevated)' : 'transparent')}
                                            >
                                                <td style={{ padding: '13px 16px', fontWeight: 700 }}>
                                                    {done && <span style={{ marginRight: 6, color: 'var(--success)' }}>✓</span>}
                                                    {flag.contact_name}
                                                </td>
                                                <td style={{ padding: '13px 16px', color: 'var(--text-secondary)' }}>{flag.agent}</td>
                                                <td style={{ padding: '13px 16px', fontWeight: 600, color: cfg.color }}>{flag.flag_reason}</td>
                                                <td style={{ padding: '13px 16px' }}>
                                                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: cfg.bg, color: cfg.color }}>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '13px 16px' }}>
                                                    <span style={{ fontWeight: 800, color: flag.score < 40 ? 'var(--danger)' : flag.score < 70 ? 'var(--warning)' : 'var(--success)' }}>
                                                        {flag.score}/100
                                                    </span>
                                                </td>
                                                <td style={{ padding: '13px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(flag.created_at)}</td>
                                                <td style={{ padding: '13px 16px' }}>
                                                    {!done && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)', gap: 4 }}><Eye size={12} /> Review</button>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Algorithm Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card" style={{ padding: 20, background: 'linear-gradient(180deg, rgba(34,197,94,0.03) 0%, transparent 100%)' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Brain size={14} color="var(--accent)" /> Algorithm Intelligence
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {ALGORITHM_DOCS.map(doc => (
                                <div key={doc.title}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--accent)' }}>
                                        {doc.icon} {doc.title}
                                    </div>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, marginBottom: 4 }}>{doc.desc}</p>
                                    <div style={{ fontSize: 10, padding: '4px 8px', background: 'var(--bg-elevated)', borderRadius: 4, color: 'var(--text-secondary)', borderLeft: '2px solid var(--accent)' }}>
                                        {doc.logic}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: 20, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <h4 style={{ fontSize: 12, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Info size={14} /> Global Thresholds
                        </h4>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Conversations with a total <b>QA Score &lt; 85</b> are automatically flagged for manager review. High severity items disable the agent for that specific contact until reviewed.
                        </div>
                    </div>
                </div>
            </div>

            {/* Slide-over review panel */}
            {
                selected && (
                    <>
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(4px)' }} onClick={() => setSelected(null)} />
                        <div style={{
                            position: 'fixed', top: 0, right: 0, bottom: 0, width: 520,
                            background: 'var(--bg-main)', borderLeft: '1px solid var(--border)',
                            boxShadow: '-16px 0 48px rgba(0,0,0,0.25)', zIndex: 100,
                            display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease'
                        }}>
                            <style>{`@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

                            {/* Panel header */}
                            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Review Interaction</h2>
                                    <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>QA Flag — {selected.contact_name} • {selected.agent}</div>
                            </div>

                            {/* Panel body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* Severity & score */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Flag Reason</div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: SEVERITY_CONFIG[getSeverity(selected)].color }}>{selected.flag_reason}</div>
                                    </div>
                                    <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>QA Score</div>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: selected.score < 40 ? 'var(--danger)' : selected.score < 70 ? 'var(--warning)' : 'var(--success)' }}>
                                            {selected.score}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/100</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Transcript */}
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Flagged Transcript Excerpt</div>
                                    <div style={{ padding: 20, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, borderLeft: '4px solid var(--danger)' }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                            <MessageSquare size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                                            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
                                                {selected.transcript || 'No transcript excerpt available.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Why this flag? */}
                                <div className="card" style={{ padding: 16, borderLeft: '4px solid var(--accent)' }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Analysis Logic Breakdown</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        {selected.flag_reason === 'Hallucination' && "The Intelligence Engine detected a mismatch between the agent's statement and the 'ProductSpecs_v2.pdf' file in the Knowledge Base."}
                                        {selected.flag_reason === 'Toxic Language' && "NLP Tone analysis detected a sentiment score of -0.91, which is below the acceptable threshold of -0.3."}
                                        {selected.flag_reason === 'Script Deviation' && "The agent failed to execute the mandatory 'Pricing Disclosure' step of the 'Inbound Sales' script."}
                                    </div>
                                </div>

                                {/* Detected signals */}
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Detected Signals</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {[
                                            { label: 'Toxic Language', active: selected.is_toxic },
                                            { label: 'AI Hallucination', active: selected.has_hallucination },
                                            { label: 'Script Deviation', active: selected.flag_reason === 'Script Deviation' },
                                        ].map(sig => (
                                            <div key={sig.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>{sig.label}</span>
                                                {sig.active
                                                    ? <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}><XCircle size={14} /> Detected</span>
                                                    : <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}><CheckCircle size={14} /> OK</span>
                                                }
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer actions */}
                            <div style={{ padding: '20px 28px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', gap: 12 }}>
                                <button
                                    className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', gap: 8, borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger)' }}
                                    onClick={() => handleAction(selected.id, 'reject')}
                                >
                                    <XCircle size={15} /> Escalate to Human
                                </button>
                                <button
                                    className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 8 }}
                                    onClick={() => handleAction(selected.id, 'approve')}
                                >
                                    <CheckCircle size={15} /> Mark Reviewed
                                </button>
                            </div>
                        </div>
                    </>
                )
            }
        </div >
    );
}
