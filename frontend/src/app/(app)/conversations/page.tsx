'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { getConversations, getConversation } from '@/lib/api';
import {
    Search, Filter, Phone, MoreVertical, Paperclip,
    Send, Zap, AlertTriangle, Clock, Bot,
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────── */
interface ConvSummary {
    id: string;
    contact_name: string;
    contact_username: string;
    channel: string;
    is_active: boolean;
    needs_human: boolean;
    last_message_at: string | null;
    analysis: {
        sentiment: string | null;
        lead_score: number | null;
        sales_outcome: string | null;
        summary: string | null;
    } | null;
}

interface MessageItem {
    id: string;
    role: string;
    message_type: string;
    content: string;
    created_at: string;
}

interface ConvDetail {
    id: string;
    contact_name: string;
    channel: string;
    needs_human: boolean;
    messages: MessageItem[];
    analysis: {
        sentiment: string | null;
        lead_score: number | null;
        sales_outcome: string | null;
        key_topics: string[];
        objections_raised: string[];
        recommended_action: string | null;
        summary: string | null;
    } | null;
}

export default function ConversationsPage() {
    const { tenantId } = useTenant();

    const [conversations, setConversations] = useState<ConvSummary[]>([]);
    const [selected, setSelected] = useState<ConvDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [channelFilter, setChannelFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Load conversation list
    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const filters: Record<string, any> = { days: 90 };
                if (channelFilter !== 'all') filters.channel = channelFilter;
                if (searchQuery) filters.search = searchQuery;

                const res = await getConversations(tenantId, filters) as { conversations: ConvSummary[] };
                // Sort: needs_human first, then by last_message_at
                const sorted = (res.conversations || []).sort((a, b) => {
                    if (a.needs_human && !b.needs_human) return -1;
                    if (!a.needs_human && b.needs_human) return 1;
                    return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
                });
                setConversations(sorted);

                // Auto-select first
                if (sorted.length > 0 && !selected) {
                    loadDetail(sorted[0].id);
                }
            } catch (e) {
                console.error('Failed to load conversations:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [tenantId, channelFilter, searchQuery]);

    async function loadDetail(convId: string) {
        try {
            setDetailLoading(true);
            const detail = await getConversation(convId, tenantId) as ConvDetail;
            setSelected(detail);
        } catch (e) {
            console.error('Failed to load conversation detail:', e);
        } finally {
            setDetailLoading(false);
        }
    }

    const channelIcon = (ch: string) => {
        if (ch === 'telegram') return '✈️';
        if (ch === 'instagram') return '📸';
        if (ch === 'facebook') return '📘';
        return '💬';
    };
    const timeAgo = (ts: string | null) => {
        if (!ts) return '';
        const diff = Date.now() - new Date(ts).getTime();
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return `${Math.floor(diff / 86400000)}d`;
    };

    const sentimentColor = (s: string | null) => {
        if (s === 'positive') return 'var(--success)';
        if (s === 'negative') return 'var(--danger)';
        return 'var(--warning)';
    };

    return (
        <div className="page-container animate-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr 320px', gap: 0, height: 'calc(100vh - 80px)', padding: 0, overflow: 'hidden' }}>
            {/* Left: Contact List */}
            <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Search */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                            <Search size={14} color="var(--text-muted)" />
                            <input
                                type="text" placeholder="Search leads..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ border: 'none', background: 'none', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: '100%' }}
                            />
                        </div>
                        <button className="icon-btn" style={{ width: 36, height: 36 }}><Filter size={14} /></button>
                    </div>
                    {/* Channel Filter */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {['all', 'telegram', 'instagram', 'facebook', 'comments'].map(ch => (
                            <button key={ch} onClick={() => setChannelFilter(ch)}
                                style={{
                                    padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                                    background: channelFilter === ch ? 'var(--accent)' : 'var(--bg-elevated)',
                                    color: channelFilter === ch ? 'white' : 'var(--text-muted)',
                                }}>
                                {ch === 'all' ? 'All' : ch === 'telegram' ? '✈️ Telegram' : ch === 'instagram' ? '📸 Instagram' : ch === 'facebook' ? '📘 Facebook' : '💬 Comments'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contacts */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
                    ) : conversations.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No conversations found</div>
                    ) : conversations.map(c => (
                        <div key={c.id}
                            onClick={() => loadDetail(c.id)}
                            className="contact-item"
                            style={{
                                padding: '12px 16px', cursor: 'pointer',
                                background: selected?.id === c.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                                borderLeft: c.needs_human ? '3px solid var(--danger)' : selected?.id === c.id ? '3px solid var(--accent)' : '3px solid transparent',
                            }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                {c.contact_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.contact_name}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(c.last_message_at)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                        {channelIcon(c.channel)} {c.analysis?.summary?.slice(0, 30) || c.contact_username}...
                                    </span>
                                    {c.analysis?.lead_score && (
                                        <span style={{ fontSize: 11, fontWeight: 700, color: c.analysis.lead_score >= 8 ? 'var(--success)' : 'var(--accent)', background: c.analysis.lead_score >= 8 ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)', padding: '2px 8px', borderRadius: 10 }}>
                                            {c.analysis.lead_score}
                                        </span>
                                    )}
                                </div>
                                {c.needs_human && (
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                        <AlertTriangle size={10} /> Help Needed
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Center: Chat */}
            <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>
                {selected ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 700, fontSize: 15 }}>{selected.contact_name}</span>
                                    {selected.needs_human && <span className="badge danger" style={{ fontSize: 10 }}>ACTION REQUIRED</span>}
                                    <span className="badge warning" style={{ fontSize: 10 }}><Clock size={10} /> SLA: 1m 30s left</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {channelIcon(selected.channel)} {selected.channel.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} • {selected.messages.length} messages
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: selected.needs_human ? 'var(--danger)' : 'var(--text-secondary)' }}>
                                    <input type="checkbox" checked={selected.needs_human} readOnly style={{ accentColor: 'var(--danger)' }} />
                                    Human Takeover
                                </label>
                                {selected.channel.includes('comment') && (
                                    <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: 'var(--accent)', padding: '4px 8px', borderRadius: 12 }}>
                                        💬 COMMENT → DM
                                    </span>
                                )}
                                <button className="icon-btn"><Phone size={14} /></button>
                                <button className="icon-btn"><MoreVertical size={14} /></button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {detailLoading ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading messages...</div>
                            ) : selected.messages.map(m => (
                                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'assistant' ? 'flex-end' : 'flex-start' }}>
                                    {m.message_type === 'comment' && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700 }}>💬 PUBLIC COMMENT</div>}
                                    {m.message_type === 'comment_reply' && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700, alignSelf: 'flex-end' }}>💬 AI PUBLIC REPLY</div>}
                                    <div className={`chat-bubble ${m.role}`} style={{
                                        maxWidth: '70%', padding: '12px 16px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.6,
                                        background: m.role === 'assistant' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'var(--bg-elevated)',
                                        color: m.role === 'assistant' ? 'white' : 'var(--text-primary)',
                                        borderBottomRightRadius: m.role === 'assistant' ? 4 : 14,
                                        borderBottomLeftRadius: m.role === 'user' ? 4 : 14,
                                        border: m.message_type.includes('comment') ? `1px solid ${m.role === 'assistant' ? '#60a5fa' : 'var(--border)'}` : 'none',
                                    }}>
                                        {m.content}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {m.role === 'assistant' && <><span>•</span> <Bot size={10} /> AI Agent <span style={{ color: 'var(--success)' }}>(92% conf)</span></>}
                                        </div>
                                        {m.role === 'user' && (
                                            <button className="btn btn-ghost" style={{ fontSize: 9, padding: '2px 6px', color: 'var(--accent)' }}>+ Add to Knowledge</button>
                                        )}
                                        {m.role === 'assistant' && (
                                            <button className="btn btn-ghost" style={{ fontSize: 9, padding: '2px 6px', color: 'var(--warning)' }}>Improve AI</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Intervention Bar */}
                        {selected.needs_human && (
                            <div style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.08)', borderTop: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                                    <AlertTriangle size={14} color="var(--danger)" />
                                    <span style={{ fontWeight: 700, color: 'var(--danger)' }}>ESCALATION REASON:</span>
                                    <span style={{ color: 'var(--text-primary)' }}>Negative sentiment threshold exceeded (-0.85).</span>
                                </div>
                                <button className="btn btn-primary" style={{ fontSize: 11, padding: '6px 16px', background: 'var(--danger)' }}>
                                    ⚡ TAKE OVER CHAT
                                </button>
                            </div>
                        )}

                        {/* Input Bar */}
                        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button className="icon-btn"><Paperclip size={14} /></button>
                            <input type="text" placeholder="Type a message or command..." style={{ flex: 1, border: 'none', background: 'var(--bg-elevated)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                            <button className="icon-btn" style={{ background: 'var(--accent)', color: 'white' }}><Zap size={14} /></button>
                            <button className="icon-btn" style={{ background: 'var(--accent)', color: 'white' }}><Send size={14} /></button>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        Select a conversation
                    </div>
                )}
            </div>

            {/* Right: AI Intelligence */}
            <div style={{ overflowY: 'auto', padding: 16 }}>
                {selected?.analysis ? (
                    <>
                        {/* Handoff Trigger */}
                        {selected.needs_human && (
                            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> Handoff Trigger</span>
                                    <span className="badge danger" style={{ fontSize: 10 }}>CRITICAL</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {selected.analysis.recommended_action || 'Immediate human intervention required.'}
                                </div>
                            </div>
                        )}

                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>AI Intelligence</h3>

                        {/* Detected Intent */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>DETECTED INTENT</div>
                            <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {selected.analysis.sales_outcome === 'won' ? '🎉' : selected.analysis.sentiment === 'negative' ? '🔥' : selected.analysis.sentiment === 'positive' ? '💡' : '📊'}
                                {selected.analysis.sales_outcome === 'won' ? 'Deal Won' :
                                    selected.analysis.sentiment === 'negative' ? 'Escalation' :
                                        selected.analysis.sales_outcome === 'lost' ? 'Lost' : 'Qualification'}
                            </div>
                            <div className="progress-bar" style={{ height: 6, marginTop: 8 }}>
                                <div className="progress-fill" style={{ width: `${(selected.analysis.lead_score || 0) * 10}%`, background: sentimentColor(selected.analysis.sentiment) }} />
                            </div>
                            <div style={{ fontSize: 11, color: sentimentColor(selected.analysis.sentiment), fontWeight: 600, textAlign: 'right', marginTop: 4 }}>
                                {Math.round((selected.analysis.lead_score || 0) * 10)}% Confidence
                            </div>
                        </div>

                        {/* Context Analysis */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>CONTEXT ANALYSIS</div>
                            {selected.analysis.key_topics && selected.analysis.key_topics.length > 0 && (
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>📌 Topics</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {selected.analysis.key_topics.map((t, i) => (
                                            <span key={i} style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: sentimentColor(selected.analysis.sentiment) }} />
                                Sentiment: {selected.analysis.sentiment ? selected.analysis.sentiment.charAt(0).toUpperCase() + selected.analysis.sentiment.slice(1) : 'Unknown'}
                            </div>
                        </div>

                        {/* Objections */}
                        {selected.analysis.objections_raised && selected.analysis.objections_raised.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>OBJECTIONS RAISED</div>
                                {selected.analysis.objections_raised.map((o, i) => (
                                    <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ color: 'var(--warning)' }}>⚠️</span> {o}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Summary */}
                        {selected.analysis.summary && (
                            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 14, fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>AI SUMMARY</div>
                                {selected.analysis.summary}
                            </div>
                        )}

                        {/* Lead Score */}
                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>LEAD SCORE</div>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid ${sentimentColor(selected.analysis.sentiment)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <span style={{ fontSize: 24, fontWeight: 900 }}>{selected.analysis.lead_score || 0}</span>
                            </div>
                        </div>
                    </>
                ) : selected ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40 }}>No analysis available for this conversation</div>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40 }}>Select a conversation to see AI intelligence</div>
                )}
            </div>
        </div>
    );
}
