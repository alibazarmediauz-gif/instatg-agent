'use client';

import { useState, useEffect } from 'react';
import {
    Megaphone, Plus, PhoneCall, PauseCircle, PlayCircle, Users, Loader2,
    BarChart2, FlaskConical, Settings, ChevronRight, Trash2, X,
    ToggleLeft, ToggleRight, AlertCircle, RefreshCw, Target,
    Clock, TrendingUp, CheckCircle2, Activity, Upload
} from 'lucide-react';
import { useTenant } from '@/lib/TenantContext';
import { getCampaigns, createCampaign, startCampaign, pauseCampaign } from '@/lib/api';

// ── Constants ─────────────────────────────────────────────────────────────────

const CHANNELS = [
    { id: 'voice', label: 'Voice Call', icon: <PhoneCall size={14} />, color: '#3b82f6' },
    { id: 'telegram', label: 'Telegram', icon: <Activity size={14} />, color: '#22c55e' },
    { id: 'sms', label: 'SMS Outbound', icon: <Megaphone size={14} />, color: '#f59e0b' },
];

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    running: { label: '● Running', bg: 'rgba(34,197,94,0.1)', color: 'var(--success)', dot: 'var(--success)' },
    paused: { label: '⏸ Paused', bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)', dot: 'var(--warning)' },
    draft: { label: '◦ Draft', bg: 'rgba(148,163,184,0.1)', color: 'var(--text-muted)', dot: 'var(--text-muted)' },
    completed: { label: '✓ Completed', bg: 'rgba(59,130,246,0.1)', color: 'var(--accent)', dot: 'var(--accent)' },
};

const BLANK_CAMPAIGN = {
    name: '',
    channel: 'voice',
    total_contacts: 1000,
    agent_id: '',
    agent_name: 'Select Agent...',
    scheduled_at: '',
    provider: 'beeline', // Default for UZ
};

export default function CampaignsPage() {
    const { tenantId } = useTenant();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [offline, setOffline] = useState(false);
    const [selected, setSelected] = useState<any | null>(null);
    const [tab, setTab] = useState<'overview' | 'ab' | 'settings'>('overview');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<any>(structuredClone(BLANK_CAMPAIGN));
    const [creating, setCreating] = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────
    const fetchCampaigns = async () => {
        try {
            const data = await getCampaigns(tenantId) as any;
            if (data.status === 'success') {
                setCampaigns(data.data || []);
                setOffline(false);
                return;
            }
        } catch {
            setOffline(true);
            setCampaigns([]);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchCampaigns(); const t = setInterval(fetchCampaigns, 10000); return () => clearInterval(t); }, [tenantId]);

    // ── Toggle running/paused ─────────────────────────────────────────
    const handleToggle = async (campaign: any) => {
        const isRunning = campaign.status === 'running';
        const next = { ...campaign, status: isRunning ? 'paused' : 'running' };
        setCampaigns(prev => prev.map(c => c.id === campaign.id ? next : c));
        if (selected?.id === campaign.id) setSelected(next);
        try { isRunning ? await pauseCampaign(tenantId, campaign.id) : await startCampaign(tenantId, campaign.id); }
        catch { /* offline — optimistic only */ }
    };

    // ── Create ────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!form.name) return;
        setCreating(true);
        const payload: any = { name: form.name, total_contacts: form.total_contacts, agent_name: form.agent_name };
        if (form.ab_enabled) payload.ab_test = {
            enabled: true,
            variant_a: { script: form.script_a, contacts: Math.floor(form.total_contacts / 2), connected: 0, conversions: 0 },
            variant_b: { script: form.script_b, contacts: Math.floor(form.total_contacts / 2), connected: 0, conversions: 0 },
        };
        const newCampaign = {
            ...payload, id: `local_${Date.now()}`, status: 'draft',
            called: 0, connected: 0, conversions: 0,
            ab_test: payload.ab_test || { enabled: false }
        };
        try {
            await createCampaign(tenantId, payload);
        } catch { /* offline */ }
        setCampaigns(prev => [...prev, newCampaign]);
        setSelected(newCampaign);
        setShowCreate(false);
        setForm(structuredClone(BLANK_CAMPAIGN));
        setCreating(false);
    };

    const rate = (n: number, d: number) => d > 0 ? `${Math.round((n / d) * 100)}%` : '—';

    if (loading) return (
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <Loader2 className="animate-spin" size={32} color="var(--accent)" />
        </div>
    );

    const totalConversions = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
    const totalCalled = campaigns.reduce((s, c) => s + (c.called || 0), 0);

    return (
        <div className="page-container animate-in" style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', height: '100vh', gap: 0 }}>
            {offline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: 'var(--warning)' }}>
                    <AlertCircle size={14} /> Backend offline — could not load campaigns.
                    <button onClick={fetchCampaigns} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><RefreshCw size={12} /> Retry</button>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Outbound Campaigns</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Run AI voice dialers with A/B script testing and real-time analytics</p>
                </div>
                <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => setShowCreate(true)}>
                    <Plus size={15} /> New Campaign
                </button>
            </div>

            {/* KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'running').length, sub: `of ${campaigns.length} total`, color: 'var(--success)', icon: <Activity size={16} /> },
                    { label: 'Total Dials', value: totalCalled.toLocaleString(), sub: 'All campaigns', color: 'var(--accent)', icon: <PhoneCall size={16} /> },
                    { label: 'Conversions', value: totalConversions.toLocaleString(), sub: `${rate(totalConversions, totalCalled)} rate`, color: 'var(--warning)', icon: <Target size={16} /> },
                    { label: 'A/B Tests Running', value: campaigns.filter(c => c.ab_test?.enabled).length, sub: 'Optimize scripts', color: '#a855f7', icon: <FlaskConical size={16} /> },
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

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, flex: 1, minHeight: 0 }}>

                {/* Campaign list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                    {campaigns.map(campaign => {
                        const cfg = STATUS_CFG[campaign.status] || STATUS_CFG.draft;
                        return (
                            <div
                                key={campaign.id}
                                onClick={() => { setSelected(campaign); setTab('overview'); }}
                                style={{
                                    padding: '16px 18px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                                    border: `1px solid ${selected?.id === campaign.id ? 'var(--accent)' : 'var(--border)'}`,
                                    background: selected?.id === campaign.id ? 'rgba(59,130,246,0.06)' : 'var(--bg-card)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, flex: 1, marginRight: 8 }}>{campaign.name}</div>
                                    <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.label}</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: CHANNELS.find(ch => ch.id === campaign.channel)?.color }}>
                                        {CHANNELS.find(ch => ch.id === campaign.channel)?.icon}
                                    </span>
                                    {campaign.agent_name}
                                </div>
                                <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>📊 {(campaign.called || 0).toLocaleString()}</span>
                                    <span style={{ color: 'var(--success)' }}>💸 {(campaign.conversions || 0)}</span>
                                    {campaign.ab_test?.enabled && <span style={{ color: '#a855f7' }}>🧪 A/B</span>}
                                </div>
                                {campaign.status !== 'draft' && (
                                    <div style={{ marginTop: 10 }}>
                                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min(100, campaign.total_contacts ? Math.round((campaign.called / campaign.total_contacts) * 100) : 0)}%`, height: '100%', background: cfg.dot, borderRadius: 2 }} />
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                                            {campaign.total_contacts ? Math.round((campaign.called / campaign.total_contacts) * 100) : 0}% processed
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Right detail panel */}
                {selected ? (
                    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {/* Panel header */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{selected.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selected.agent_name} · {selected.total_contacts?.toLocaleString()} contacts</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {selected.status === 'running' ? (
                                    <button className="btn btn-secondary" style={{ gap: 6, color: 'var(--warning)' }} onClick={() => handleToggle(selected)}>
                                        <PauseCircle size={14} /> Pause
                                    </button>
                                ) : (
                                    <button className="btn btn-primary" style={{ gap: 6 }} onClick={() => handleToggle(selected)}>
                                        <PlayCircle size={14} /> {selected.status === 'draft' ? 'Launch' : 'Resume'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                            {[
                                { id: 'overview', label: '📊 Overview' },
                                { id: 'ab', label: '🧪 A/B Test' },
                                { id: 'settings', label: '⚙️ Settings' },
                            ].map(t => (
                                <button key={t.id} onClick={() => setTab(t.id as any)} style={{
                                    padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                    color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
                                    borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                                }}>{t.label}</button>
                            ))}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>

                            {/* ── Overview ─────────────────────────── */}
                            {tab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                        {[
                                            { label: 'Contacts Dialed', value: (selected.called || 0).toLocaleString(), sub: `of ${(selected.total_contacts || 0).toLocaleString()}`, color: 'var(--accent)' },
                                            { label: 'Connected', value: (selected.connected || 0).toLocaleString(), sub: `${rate(selected.connected, selected.called)} connect rate`, color: 'var(--warning)' },
                                            { label: 'Conversions', value: (selected.conversions || 0).toLocaleString(), sub: `${rate(selected.conversions, selected.connected)} from connected`, color: 'var(--success)' },
                                        ].map(stat => (
                                            <div key={stat.label} style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center' }}>
                                                <div style={{ fontSize: 28, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{stat.label}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stat.sub}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Progress bar */}
                                    {selected.total_contacts > 0 && (
                                        <div style={{ padding: '16px 20px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>Campaign Progress</span>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{Math.round(((selected.called || 0) / selected.total_contacts) * 100)}%</span>
                                            </div>
                                            <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                                                <div style={{ width: `${Math.round(((selected.called || 0) / selected.total_contacts) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), #8b5cf6)', borderRadius: 5, transition: 'width 0.6s ease' }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* How it works */}
                                    <div style={{ padding: '16px 20px', background: 'rgba(59,130,246,0.05)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.2)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>📞 How Outbound Campaigns Work</div>
                                        The AI voice agent ({selected.agent_name}) calls each contact from your list at the scheduled time. The agent uses its trained script to qualify leads, answer objections, and book meetings. Calls that result in a positive intent are marked as Conversions and pushed to the CRM pipeline automatically.
                                    </div>
                                </div>
                            )}

                            {/* ── A/B Test ─────────────────────────── */}
                            {tab === 'ab' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🧪 A/B Script Testing</h3>
                                            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Test two different call scripts to find the highest-converting opener</p>
                                        </div>
                                        <button
                                            onClick={() => setSelected({ ...selected, ab_test: { ...selected.ab_test, enabled: !selected.ab_test?.enabled } })}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: selected.ab_test?.enabled ? 'var(--success)' : 'var(--text-muted)' }}
                                        >
                                            {selected.ab_test?.enabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                                        </button>
                                    </div>

                                    {!selected.ab_test?.enabled ? (
                                        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                            <FlaskConical size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                            <div style={{ fontSize: 14, marginBottom: 8 }}>A/B testing is disabled</div>
                                            <div style={{ fontSize: 12 }}>Toggle above to enable script testing</div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Winner badge */}
                                            {selected.ab_test?.variant_a?.conversions > 0 && (
                                                <div style={{ padding: '10px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                                                    🏆 Variant {(selected.ab_test.variant_a.conversions || 0) > (selected.ab_test.variant_b?.conversions || 0) ? 'A' : 'B'} is winning with {Math.max(selected.ab_test.variant_a.conversions || 0, selected.ab_test.variant_b?.conversions || 0)} conversions
                                                </div>
                                            )}

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                                {(['a', 'b'] as const).map(variant => {
                                                    const v = selected.ab_test[`variant_${variant}`] || {};
                                                    const isWinner = (v.conversions || 0) > (selected.ab_test[`variant_${variant === 'a' ? 'b' : 'a'}`]?.conversions || 0);
                                                    return (
                                                        <div key={variant} style={{ padding: 20, background: 'var(--bg-elevated)', borderRadius: 12, border: `1.5px solid ${isWinner && v.conversions > 0 ? 'var(--success)' : 'var(--border)'}` }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                                                <span style={{ fontWeight: 800, fontSize: 14 }}>Variant {variant.toUpperCase()}</span>
                                                                {isWinner && v.conversions > 0 && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}>WINNER</span>}
                                                            </div>
                                                            <div style={{ padding: '12px 14px', background: 'var(--bg-main)', borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 16, minHeight: 70 }}>
                                                                "{v.script || 'No script yet'}"
                                                            </div>
                                                            <textarea
                                                                className="input" rows={3} placeholder="Enter script..."
                                                                value={v.script || ''}
                                                                onChange={e => setSelected({
                                                                    ...selected, ab_test: {
                                                                        ...selected.ab_test,
                                                                        [`variant_${variant}`]: { ...v, script: e.target.value }
                                                                    }
                                                                })}
                                                                style={{ fontSize: 12, marginBottom: 16 }}
                                                            />
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                                                                {[
                                                                    { label: 'Contacts', value: (v.contacts || 0).toLocaleString() },
                                                                    { label: 'Connected', value: (v.connected || 0).toLocaleString() },
                                                                    { label: 'Conversions', value: (v.conversions || 0) },
                                                                ].map(s => (
                                                                    <div key={s.label} style={{ padding: '8px 0', background: 'var(--bg-main)', borderRadius: 8 }}>
                                                                        <div style={{ fontSize: 16, fontWeight: 800 }}>{s.value}</div>
                                                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <button className="btn btn-primary" style={{ justifyContent: 'center', gap: 8 }}>
                                                <FlaskConical size={14} /> Save A/B Test Configuration
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ── Settings ─────────────────────────── */}
                            {tab === 'settings' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign Name</label>
                                            <input className="input" value={selected.name} onChange={e => setSelected({ ...selected, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Agent</label>
                                            <select className="input" value={selected.agent_name} onChange={e => setSelected({ ...selected, agent_name: e.target.value })}>
                                                <option value="Voice SDR Alpha">Voice SDR Alpha</option>
                                                <option value="Voice SDR Beta">Voice SDR Beta</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule Start</label>
                                        <input type="datetime-local" className="input" value={selected.scheduled_at || ''} onChange={e => setSelected({ ...selected, scheduled_at: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', gap: 8 }}><Upload size={13} /> Import Contacts (.csv)</button>
                                        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 8 }}><CheckCircle2 size={13} /> Save Settings</button>
                                    </div>
                                    <button className="btn btn-ghost" style={{ color: 'var(--danger)', gap: 8 }}><Trash2 size={13} /> Delete Campaign</button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
                        <Megaphone size={48} style={{ opacity: 0.15 }} />
                        <div style={{ fontSize: 16, fontWeight: 600 }}>Select a campaign to view details</div>
                        <button className="btn btn-primary" style={{ gap: 8, marginTop: 8 }} onClick={() => setShowCreate(true)}>
                            <Plus size={14} /> New Campaign
                        </button>
                    </div>
                )}
            </div>

            {/* ── Create Campaign Modal ───────────────────────────────── */}
            {showCreate && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99 }} onClick={() => setShowCreate(false)} />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 580, background: 'var(--bg-main)', borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.4)', border: '1px solid var(--border)', zIndex: 100, padding: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>New Campaign</h2>
                            <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Campaign Name *</label>
                                    <input className="input" placeholder="Q2 Outbound — SMB" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Total Contacts</label>
                                    <input type="number" className="input" value={form.total_contacts} onChange={e => setForm({ ...form, total_contacts: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Campaign Channel</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                    {CHANNELS.map(ch => (
                                        <button
                                            key={ch.id}
                                            onClick={() => setForm({ ...form, channel: ch.id })}
                                            style={{
                                                padding: '12px 8px', borderRadius: 12, border: '1.5px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s',
                                                borderColor: form.channel === ch.id ? 'var(--accent)' : 'var(--border)',
                                                background: form.channel === ch.id ? 'rgba(59,130,246,0.05)' : 'transparent',
                                                color: form.channel === ch.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {ch.icon}
                                            <span style={{ fontSize: 11, fontWeight: 800 }}>{ch.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Target AI Agent</label>
                                    <select className="input" value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })}>
                                        <option value="Voice SDR Alpha">Voice SDR Alpha</option>
                                        <option value="Voice SDR Beta">Voice SDR Beta</option>
                                        <option value="Chat Closer Pro">Chat Closer Pro</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>UZ Provider</label>
                                    <select className="input" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}>
                                        <option value="beeline">Beeline Business</option>
                                        <option value="ucell">Ucell Corporate</option>
                                        <option value="uztelecom">Uztelecom</option>
                                        <option value="mobiuz">Mobiuz</option>
                                    </select>
                                </div>
                            </div>

                            {/* A/B toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                <FlaskConical size={16} color="#a855f7" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>Enable A/B Script Testing</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Split contacts 50/50, test two openers</div>
                                </div>
                                <button onClick={() => setForm({ ...form, ab_enabled: !form.ab_enabled })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.ab_enabled ? '#a855f7' : 'var(--text-muted)' }}>
                                    {form.ab_enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>

                            {form.ab_enabled && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Script A</label>
                                        <textarea className="input" rows={3} value={form.script_a} onChange={e => setForm({ ...form, script_a: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Script B</label>
                                        <textarea className="input" rows={3} value={form.script_b} onChange={e => setForm({ ...form, script_b: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCreate(false)}>Cancel</button>
                                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 8 }} onClick={handleCreate} disabled={!form.name || creating}>
                                    {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                                    {creating ? 'Creating...' : 'Create Campaign'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
