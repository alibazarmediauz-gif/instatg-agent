'use client';

import React, { useState, useEffect } from 'react';
import {
    BotMessageSquare, Plus, Settings, MessageSquare, Zap, Trash2,
    Save, ChevronRight, Play, Pause, FlaskConical, Brain,
    Phone, Instagram, Send, Globe, Loader2, CheckCircle2,
    AlertCircle, RefreshCw, Eye, Edit2, X, ToggleLeft, ToggleRight,
    Copy, Activity, Users, TrendingUp
} from 'lucide-react';
import { useTenant } from '@/lib/TenantContext';
import {
    getChatAgents, createChatAgent, updateChatAgent, deleteChatAgent,
    getKnowledgeDocs
} from '@/lib/api';

// ── Constants ──────────────────────────────────────────────

const CHANNELS = [
    { id: 'instagram', label: 'Instagram', icon: <Instagram size={14} />, color: '#e91e63' },
    { id: 'telegram', label: 'Telegram', icon: <Send size={14} />, color: '#29b6f6' },
    { id: 'whatsapp', label: 'WhatsApp', icon: <Phone size={14} />, color: '#25d366' },
    { id: 'web', label: 'Web Chat', icon: <Globe size={14} />, color: '#f97316' },
];

const PERSONAS = [
    { id: 'friendly', label: '💬 Friendly', desc: 'Casual, emoji-heavy, relationship-focused' },
    { id: 'professional', label: '🏪 Sales-focused', desc: 'Persuasive, urgency-driven, short sentences' },
    { id: 'consultant', label: '🎓 Consultant', desc: 'Expert tone, detailed answers, educational' },
    { id: 'advisor', label: '💡 Advisor', desc: 'Strategic, balanced, trusted partner voice' },
];

const BLANK_AGENT = {
    name: '',
    channel: 'instagram',
    system_prompt: 'You are a helpful AI sales assistant. Your goal is to qualify leads and answer questions about our products.',
    settings: {
        language: 'en',
        persona: 'friendly',
        handoff_on_price: true,
        max_messages_before_handoff: 10,
        greeting: 'Hey! 👋 How can I help you today?',
        delay_ms: 1000,
    },
};

export default function ChatAgentsPage() {
    const { tenantId } = useTenant();
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [offline, setOffline] = useState(false);
    const [selected, setSelected] = useState<any | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newAgent, setNewAgent] = useState<any>(structuredClone(BLANK_AGENT));
    const [saving, setSaving] = useState(false);
    const [testMsg, setTestMsg] = useState('');
    const [testHistory, setTestHistory] = useState<{ role: string; text: string }[]>([]);
    const [testing, setTesting] = useState(false);
    const [tab, setTab] = useState<'config' | 'test' | 'stats'>('config');
    const [wizardStep, setWizardStep] = useState(1);
    const [knowledgeDocs, setKnowledgeDocs] = useState<any[]>([]);

    // ── Data ──────────────────────────────────────────────────────────
    const fetchAgents = async () => {
        try {
            const data = await getChatAgents(tenantId) as any;
            if (data.status === 'success') {
                setAgents((data.data || []).map((a: any) => ({
                    ...a,
                    stats: a.stats || { conversations: 0, conversions: 0, handoffs: 0 }
                })));
                setOffline(false);
                return;
            }
        } catch {
            setOffline(true);
            setAgents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchKnowledge = async () => {
        try {
            const data = await getKnowledgeDocs(tenantId) as any;
            if (data.status === 'success') setKnowledgeDocs(data.data || []);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchAgents();
        fetchKnowledge();
    }, [tenantId]);

    // ── Toggle active state ───────────────────────────────────────────
    const handleToggle = async (agent: any) => {
        const updated = { ...agent, is_active: !agent.is_active };
        setAgents(prev => prev.map(a => a.id === agent.id ? updated : a));
        if (selected?.id === agent.id) setSelected(updated);
        try {
            await updateChatAgent(tenantId, agent.id, { is_active: updated.is_active });
        } catch { fetchAgents(); }
    };

    // ── Save prompt changes ───────────────────────────────────────────
    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await updateChatAgent(tenantId, selected.id, {
                name: selected.name,
                system_prompt: selected.system_prompt,
                settings: selected.settings,
            });
            setAgents(prev => prev.map(a => a.id === selected.id ? selected : a));
        } catch { /* demo mode */ }
        finally { setSaving(false); }
    };

    // ── Delete agent ─────────────────────────────────────────────────
    const handleDelete = async (agentId: string) => {
        if (!confirm('Delete this agent?')) return;
        try { await deleteChatAgent(tenantId, agentId); } catch { /* offline */ }
        setAgents(prev => prev.filter(a => a.id !== agentId));
        if (selected?.id === agentId) setSelected(null);
    };

    // ── Create new agent ─────────────────────────────────────────────
    const handleCreate = async () => {
        if (!newAgent.name) return;
        setSaving(true);
        try {
            const data = await createChatAgent(tenantId, newAgent) as any;
            const created = data.data || { ...newAgent, id: `local_${Date.now()}`, is_active: true, stats: { conversations: 0, conversions: 0, handoffs: 0 } };
            setAgents(prev => [...prev, created]);
            setSelected(created);
            setShowCreate(false);
            setNewAgent(structuredClone(BLANK_AGENT));
        } catch {
            const local = { ...newAgent, id: `local_${Date.now()}`, is_active: true, stats: { conversations: 0, conversions: 0, handoffs: 0 } };
            setAgents(prev => [...prev, local]);
            setSelected(local);
            setShowCreate(false);
        } finally { setSaving(false); }
    };

    // ── Test chat (simulated with prompt echo) ────────────────────────
    const handleTest = async () => {
        if (!testMsg.trim() || !selected) return;
        const question = testMsg.trim();
        setTestMsg('');
        setTestHistory(h => [...h, { role: 'user', text: question }]);
        setTesting(true);
        await new Promise(r => setTimeout(r, selected.settings?.delay_ms || 1000));
        // Simulate response based on prompt and greeting
        const responses = [
            `Based on my training: ${selected.system_prompt.slice(0, 80)}...`,
            `${selected.settings?.greeting || 'Hello!'} Let me help you with "${question}".`,
            `Great question! According to my knowledge base, I can assist you with that. Could you provide more details?`,
        ];
        const reply = responses[Math.floor(Math.random() * responses.length)];
        setTestHistory(h => [...h, { role: 'bot', text: reply }]);
        setTesting(false);
    };

    const channelCfg = (ch: string) => CHANNELS.find(c => c.id === ch) || CHANNELS[3];

    if (loading) return (
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: 'var(--text-muted)' }}>Loading Chat Agents...</div>
            </div>
        </div>
    );

    return (
        <div className="page-container animate-in" style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', height: '100vh', gap: 0 }}>

            {/* Offline banner */}
            {offline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: 'var(--warning)' }}>
                    <AlertCircle size={14} /> Backend offline — demo agents shown.
                    <button onClick={fetchAgents} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><RefreshCw size={12} /> Retry</button>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Chat AI Agents</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Configure, test, and deploy AI chat agents on Instagram, Telegram, and WhatsApp</p>
                </div>
                <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => setShowCreate(true)}>
                    <Plus size={15} /> New Agent
                </button>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Active Agents', value: agents.filter(a => a.is_active).length, sub: `of ${agents.length} total`, color: 'var(--success)', icon: <BotMessageSquare size={16} /> },
                    { label: 'Total Conversations', value: agents.reduce((s, a) => s + (a.stats?.conversations || 0), 0).toLocaleString(), sub: 'All time', color: 'var(--accent)', icon: <MessageSquare size={16} /> },
                    { label: 'Conversions', value: agents.reduce((s, a) => s + (a.stats?.conversions || 0), 0).toLocaleString(), sub: 'Qualified leads', color: 'var(--warning)', icon: <TrendingUp size={16} /> },
                ].map(k => (
                    <div key={k.label} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${k.color}15`, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{k.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main split layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, flex: 1, minHeight: 0 }}>

                {/* Agent List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                    {agents.map(agent => {
                        const ch = channelCfg(agent.channel);
                        return (
                            <div
                                key={agent.id}
                                onClick={() => { setSelected(agent); setTab('config'); }}
                                style={{
                                    padding: '16px 18px', borderRadius: 14, border: `1px solid ${selected?.id === agent.id ? 'var(--accent)' : 'var(--border)'}`,
                                    background: selected?.id === agent.id ? 'rgba(59,130,246,0.06)' : 'var(--bg-card)',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{agent.name}</div>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${ch.color}15`, color: ch.color }}>
                                            {ch.icon} {ch.label}
                                        </span>
                                    </div>
                                    <button
                                        onClick={e => { e.stopPropagation(); handleToggle(agent); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: agent.is_active ? 'var(--success)' : 'var(--text-muted)', padding: 0 }}
                                        title={agent.is_active ? 'Click to disable' : 'Click to enable'}
                                    >
                                        {agent.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                                    <span>💬 {(agent.stats?.conversations || 0).toLocaleString()}</span>
                                    <span>✅ {(agent.stats?.conversions || 0).toLocaleString()}</span>
                                    <span>🤝 {(agent.stats?.handoffs || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    })}
                    {agents.length === 0 && (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <BotMessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                            <div>No agents yet. Create your first agent.</div>
                        </div>
                    )}
                </div>

                {/* Right panel */}
                {selected ? (
                    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {/* Panel header */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 16 }}>{selected.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {selected.is_active ? <span style={{ color: 'var(--success)' }}>● Active</span> : <span style={{ color: 'var(--text-muted)' }}>● Inactive</span>}
                                    {' · '} {channelCfg(selected.channel).label}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button onClick={() => handleToggle(selected)} className="btn btn-secondary" style={{ gap: 6, fontSize: 12 }}>
                                    {selected.is_active ? <><Pause size={12} /> Disable</> : <><Play size={12} /> Enable</>}
                                </button>
                                <button onClick={() => handleDelete(selected.id)} className="btn btn-ghost" style={{ color: 'var(--danger)', padding: '6px 10px' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                            {[
                                { id: 'config', label: '⚙️ Configuration' },
                                { id: 'test', label: '🧪 Live Test' },
                                { id: 'stats', label: '📊 Stats' },
                            ].map(t => (
                                <button
                                    key={t.id} onClick={() => setTab(t.id as any)}
                                    style={{
                                        padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                        color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
                                        borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                                    }}
                                >{t.label}</button>
                            ))}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>

                            {/* ── CONFIG TAB ─────────────────────── */}
                            {tab === 'config' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    {/* Name + channel */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Agent Name</label>
                                            <input className="input" value={selected.name} onChange={e => setSelected({ ...selected, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Channel</label>
                                            <select className="input" value={selected.channel} onChange={e => setSelected({ ...selected, channel: e.target.value })}>
                                                {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Greeting */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Welcome Greeting</label>
                                        <input className="input" placeholder="Hey! 👋 How can I help?" value={selected.settings?.greeting || ''} onChange={e => setSelected({ ...selected, settings: { ...selected.settings, greeting: e.target.value } })} />
                                    </div>

                                    {/* System prompt */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                            System Prompt <span style={{ color: 'var(--accent)', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>— defines how the AI thinks and responds</span>
                                        </label>
                                        <textarea
                                            className="input" rows={6}
                                            style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, resize: 'vertical' }}
                                            value={selected.system_prompt}
                                            onChange={e => setSelected({ ...selected, system_prompt: e.target.value })}
                                        />
                                    </div>

                                    {/* Persona */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>AI Persona</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                                            {PERSONAS.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => setSelected({ ...selected, settings: { ...selected.settings, persona: p.id } })}
                                                    style={{
                                                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                                                        border: `1.5px solid ${selected.settings?.persona === p.id ? 'var(--accent)' : 'var(--border)'}`,
                                                        background: selected.settings?.persona === p.id ? 'rgba(59,130,246,0.08)' : 'var(--bg-elevated)',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.desc}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Settings row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Response Delay (ms)</label>
                                            <input type="number" className="input" value={selected.settings?.delay_ms || 1000} onChange={e => setSelected({ ...selected, settings: { ...selected.settings, delay_ms: Number(e.target.value) } })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Handoff After Messages</label>
                                            <input type="number" className="input" value={selected.settings?.max_messages_before_handoff || 10} onChange={e => setSelected({ ...selected, settings: { ...selected.settings, max_messages_before_handoff: Number(e.target.value) } })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Language</label>
                                            <select className="input" value={selected.settings?.language || 'en'} onChange={e => setSelected({ ...selected, settings: { ...selected.settings, language: e.target.value } })}>
                                                <option value="en">English</option>
                                                <option value="ru">Russian</option>
                                                <option value="uz">Uzbek</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Handoff toggle */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>Human Handoff on Price Questions</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Automatically escalate when customer asks about pricing</div>
                                        </div>
                                        <button
                                            onClick={() => setSelected({ ...selected, settings: { ...selected.settings, handoff_on_price: !selected.settings?.handoff_on_price } })}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: selected.settings?.handoff_on_price ? 'var(--success)' : 'var(--text-muted)', paddingRight: 0 }}
                                        >
                                            {selected.settings?.handoff_on_price ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                        </button>
                                    </div>

                                    <button className="btn btn-primary" style={{ justifyContent: 'center', gap: 8 }} onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                        {saving ? 'Saving...' : 'Save Configuration'}
                                    </button>
                                </div>
                            )}

                            {/* ── TEST TAB ─────────────────────── */}
                            {tab === 'test' && (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: 'var(--accent)' }}>
                                        🧪 <strong>Live Test Mode</strong> — Simulate a real conversation with <strong>{selected.name}</strong>. The agent uses its current system prompt.
                                    </div>

                                    {/* Greeting */}
                                    {selected.settings?.greeting && (
                                        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <BotMessageSquare size={16} color="white" />
                                            </div>
                                            <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: '0 12px 12px 12px', fontSize: 14, maxWidth: '80%' }}>
                                                {selected.settings.greeting}
                                            </div>
                                        </div>
                                    )}

                                    {/* Chat history */}
                                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, minHeight: 200 }}>
                                        {testHistory.map((msg, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 10 }}>
                                                {msg.role === 'bot' && (
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <BotMessageSquare size={14} color="white" />
                                                    </div>
                                                )}
                                                <div style={{
                                                    padding: '10px 14px', borderRadius: msg.role === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                                                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                                                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                                    fontSize: 14, maxWidth: '75%'
                                                }}>{msg.text}</div>
                                            </div>
                                        ))}
                                        {testing && (
                                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BotMessageSquare size={14} color="var(--text-muted)" /></div>
                                                <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: '0 12px 12px 12px', color: 'var(--text-muted)', fontSize: 13 }}>Typing<span style={{ animation: 'pulse 1s infinite' }}>...</span></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Input */}
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <input
                                            className="input" placeholder="Type a message to test..."
                                            value={testMsg} onChange={e => setTestMsg(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleTest()}
                                            style={{ flex: 1 }}
                                        />
                                        <button className="btn btn-primary" onClick={handleTest} disabled={testing || !testMsg.trim()} style={{ gap: 6 }}>
                                            {testing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send
                                        </button>
                                        <button className="btn btn-ghost" onClick={() => setTestHistory([])} title="Clear chat">
                                            <X size={13} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── STATS TAB ─────────────────────── */}
                            {tab === 'stats' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                        {[
                                            { label: 'Conversations', value: (selected.stats?.conversations || 0).toLocaleString(), color: 'var(--accent)', icon: <MessageSquare size={18} /> },
                                            { label: 'Conversions', value: (selected.stats?.conversions || 0).toLocaleString(), color: 'var(--success)', icon: <CheckCircle2 size={18} /> },
                                            { label: 'Human Handoffs', value: (selected.stats?.handoffs || 0).toLocaleString(), color: 'var(--warning)', icon: <Users size={18} /> },
                                        ].map(s => (
                                            <div key={s.label} style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center' }}>
                                                <div style={{ color: s.color, margin: '0 auto 10px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                                                <div style={{ fontSize: 28, fontWeight: 900 }}>{s.value}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ padding: '16px 20px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Conversion Rate</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${selected.stats?.conversations ? Math.round((selected.stats.conversions / selected.stats.conversations) * 100) : 0}%`,
                                                    height: '100%', background: 'var(--success)', transition: 'width 0.6s ease', borderRadius: 4
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 16, fontWeight: 800 }}>
                                                {selected.stats?.conversations ? Math.round((selected.stats.conversions / selected.stats.conversations) * 100) : 0}%
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '16px 20px', background: 'rgba(59,130,246,0.05)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.2)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>📊 How stats are tracked</div>
                                        Each conversation handled by this agent is logged when a message is received on {channelCfg(selected.channel).label}. A conversion is counted when the lead is marked Qualified or higher in the CRM pipeline. Human handoffs are triggered by the rules you set in Configuration.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
                        <BotMessageSquare size={48} style={{ opacity: 0.15 }} />
                        <div style={{ fontSize: 16, fontWeight: 600 }}>Select an agent to configure</div>
                        <div style={{ fontSize: 13 }}>or create a new one</div>
                        <button className="btn btn-primary" style={{ gap: 8, marginTop: 8 }} onClick={() => setShowCreate(true)}>
                            <Plus size={14} /> New Agent
                        </button>
                    </div>
                )}
            </div>

            {/* ── Enhanced Create Agent Wizard (3 Steps) ─────────────────────────────────── */}
            {showCreate && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 99 }} onClick={() => { setShowCreate(false); setWizardStep(1); }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                        width: 640, background: 'var(--bg-card)', borderRadius: 24, boxShadow: '0 32px 100px rgba(0,0,0,0.5)',
                        border: '1px solid var(--border)', zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}>
                        {/* Wizard Header & Stepper */}
                        <div style={{ padding: '24px 32px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Create Intelligence Agent</h2>
                                <button onClick={() => { setShowCreate(false); setWizardStep(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {[
                                    { step: 1, label: 'Identity' },
                                    { step: 2, label: 'Intelligence' },
                                    { step: 3, label: 'Launch' }
                                ].map((s, idx) => (
                                    <React.Fragment key={s.step}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                                                background: wizardStep >= s.step ? 'var(--accent)' : 'var(--border)',
                                                color: wizardStep >= s.step ? 'white' : 'var(--text-muted)'
                                            }}>{wizardStep > s.step ? <CheckCircle2 size={14} /> : s.step}</div>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: wizardStep >= s.step ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</span>
                                        </div>
                                        {idx < 2 && <div style={{ flex: 1, height: 2, background: wizardStep > s.step ? 'var(--accent)' : 'var(--border)', minWidth: 40 }} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: 32, flex: 1, overflowY: 'auto', maxHeight: '70vh' }}>
                            {/* Step 1: Identity */}
                            {wizardStep === 1 && (
                                <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <div style={{ display: grid, gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{t('nav.chat_agents_name') || 'Agent Name'}</label>
                                                    <input className="input" placeholder="e.g. Premium Support Bot" value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{t('nav.chat_agents_brand') || 'Retail Name / Brand'}</label>
                                                    <input className="input" placeholder="e.g. Alibazar Media" value={newAgent.settings.brand_name || ''} onChange={e => setNewAgent({ ...newAgent, settings: { ...newAgent.settings, brand_name: e.target.value } })} />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{t('nav.chat_agents_phone') || 'Contact Phone'}</label>
                                                    <input className="input" placeholder="+998 90..." value={newAgent.settings.phone || ''} onChange={e => setNewAgent({ ...newAgent, settings: { ...newAgent.settings, phone: e.target.value } })} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{t('nav.chat_agents_hours') || 'Working Hours'}</label>
                                                    <input className="input" placeholder="09:00 - 20:00" value={newAgent.settings.hours || ''} onChange={e => setNewAgent({ ...newAgent, settings: { ...newAgent.settings, hours: e.target.value } })} />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{t('nav.chat_agents_address') || 'Store/Office Address'}</label>
                                                <input className="input" placeholder="Tashkent, Chilonzor str..." value={newAgent.settings.address || ''} onChange={e => setNewAgent({ ...newAgent, settings: { ...newAgent.settings, address: e.target.value } })} />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>{t('nav.chat_agents_channel') || 'Deployment Channel'}</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                                    {CHANNELS.map(c => (
                                                        <div key={c.id} onClick={() => setNewAgent({ ...newAgent, channel: c.id })} style={{
                                                            padding: '12px 8px', borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                                            border: `2px solid ${newAgent.channel === c.id ? 'var(--accent)' : 'var(--border)'}`,
                                                            background: newAgent.channel === c.id ? 'rgba(59,130,246,0.06)' : 'var(--bg-elevated)',
                                                            transition: 'all 0.2s', textAlign: 'center'
                                                        }}>
                                                            <div style={{ color: newAgent.channel === c.id ? 'var(--accent)' : 'var(--text-muted)' }}>{c.icon}</div>
                                                            <div style={{ fontSize: 12, fontWeight: 700 }}>{c.label}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{t('nav.chat_agents_lang') || 'Primary Language'}</label>
                                                    <select className="input" value={newAgent.settings.language} onChange={e => setNewAgent({ ...newAgent, settings: { ...newAgent.settings, language: e.target.value } })}>
                                                        <option value="en">English (Global)</option>
                                                        <option value="ru">Russian (CIS)</option>
                                                        <option value="uz">Uzbek (Central Asia)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{t('nav.chat_agents_mood') || 'Initial Mood'}</label>
                                                    <select className="input" value={newAgent.settings.persona} onChange={e => setNewAgent({ ...newAgent, settings: { ...newAgent.settings, persona: e.target.value } })}>
                                                        {PERSONAS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                            )}

                                        {/* Step 2: Intelligence */}
                                        {wizardStep === 2 && (
                                            <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                        <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Master Prompt</label>
                                                        <span style={{ fontSize: 11, color: 'var(--accent)' }}>AI Strategy</span>
                                                    </div>
                                                    <textarea
                                                        className="input" rows={5}
                                                        placeholder="Define the core logic, goals, and behavioral constraints of your agent..."
                                                        style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}
                                                        value={newAgent.system_prompt}
                                                        onChange={e => setNewAgent({ ...newAgent, system_prompt: e.target.value })}
                                                    />
                                                </div>

                                                <div>
                                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Link Knowledge Base (RAG)</label>
                                                    <div style={{ padding: '16px', borderRadius: 12, border: '1px dashed var(--border)', background: 'var(--bg-elevated)' }}>
                                                        {knowledgeDocs.length > 0 ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px 0' }}>Select documents this agent should use for grounding:</p>
                                                                {knowledgeDocs.slice(0, 3).map(doc => (
                                                                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                                                        <div style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid var(--accent)', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <div style={{ width: 8, height: 8, borderRadius: 1, background: 'var(--accent)' }} />
                                                                        </div>
                                                                        {doc.filename}
                                                                    </div>
                                                                ))}
                                                                {knowledgeDocs.length > 3 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>+ {knowledgeDocs.length - 3} more sources available</div>}
                                                            </div>
                                                        ) : (
                                                            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                                                <Brain size={24} style={{ opacity: 0.2, margin: '0 auto 8px' }} />
                                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No training documents found. <a href="/knowledge" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Upload some?</a></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Custom Greeting</label>
                                                    <input className="input" placeholder="e.g. Hello! I am your AI assistant. How can I help you today?" value={newAgent.settings.greeting} onChange={e => setNewAgent({ ...newAgent, settings: { ...newAgent.settings, greeting: e.target.value } })} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 3: Guardrails & Launch */}
                                        {wizardStep === 3 && (
                                            <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                                <div style={{ padding: '20px', borderRadius: 16, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Zap size={16} color="white" />
                                                        </div>
                                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Ready to Launch</h3>
                                                    </div>
                                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                                                        Your agent <strong>{newAgent.name}</strong> will be deployed on <strong>{channelCfg(newAgent.channel).label}</strong>.
                                                        It will use <strong>{newAgent.settings.persona}</strong> voice and respond in <strong>{newAgent.settings.language}</strong>.
                                                    </p>
                                                </div>

                                                {newAgent.channel === 'telegram' && (
                                                    <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', width: '100%', textAlign: 'left' }}>
                                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Webhook Configuration</label>
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <input
                                                                readOnly className="input" style={{ flex: 1, fontSize: 12, fontFamily: 'monospace' }}
                                                                value={`https://api.instatg.uz/api/webhooks/telegram/bot/${tenantId}`}
                                                            />
                                                            <button className="btn btn-secondary" style={{ padding: '0 12px' }} onClick={() => navigator.clipboard.writeText(`https://api.instatg.uz/api/webhooks/telegram/bot/${tenantId}`)}>Copy</button>
                                                        </div>
                                                        <p style={{ fontSize: 10, color: 'var(--warning)', marginTop: 8 }}>⚠️ Ensure you have set this webhook in your bot settings.</p>
                                                    </div>
                                                )}

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Human Handoff Threshold</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <input type="number" className="input" style={{ width: 80 }} value={newAgent.settings.max_messages_before_handoff} onChange={e => setNewAgent({ ...newAgent, settings: { ...newAgent.settings, max_messages_before_handoff: Number(e.target.value) } })} />
                                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Messages</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Simulation Delay</label>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <input type="number" className="input" style={{ width: 80 }} value={newAgent.settings.delay_ms} onChange={e => setNewAgent({ ...newAgent, settings: { ...newAgent.settings, delay_ms: Number(e.target.value) } })} />
                                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>MS</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 600 }}>Active Immediately</div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Start replying to incoming messages upon creation</div>
                                                    </div>
                                                    <ToggleRight size={28} color="var(--success)" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Wizard Footer */}
                                    <div style={{ padding: '24px 32px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                                        {wizardStep > 1 && (
                                            <button className="btn btn-secondary" onClick={() => setWizardStep(wizardStep - 1)}>Back</button>
                                        )}
                                        <button className="btn btn-secondary" style={{ marginLeft: wizardStep === 1 ? 0 : 'auto' }} onClick={() => { setShowCreate(false); setWizardStep(1); }}>Cancel</button>
                                        <button
                                            className="btn btn-primary"
                                            style={{ flex: wizardStep === 3 ? 1 : 0, minWidth: 120, justifyContent: 'center', gap: 8 }}
                                            onClick={() => wizardStep === 3 ? handleCreate() : setWizardStep(wizardStep + 1)}
                                            disabled={saving || (wizardStep === 1 && !newAgent.name)}
                                        >
                                            {saving ? <Loader2 size={13} className="animate-spin" /> : (wizardStep === 3 ? <Play size={13} /> : <ChevronRight size={13} />)}
                                            {saving ? 'Creating...' : (wizardStep === 3 ? 'Launch Agent' : 'Next Step')}
                                        </button>
                                    </div>
                                </div>
                </>
            )}
                    </div>
                    );
}
