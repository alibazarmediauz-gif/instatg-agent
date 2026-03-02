'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Plus, Search, X, Zap, Check, Loader2,
    ArrowUpRight, BotMessageSquare, AlertCircle,
    DollarSign, Activity, Phone, Mail, ChevronDown,
    LayoutGrid, List, SlidersHorizontal, ChevronRight,
    Clock, Star, RefreshCw, Target, Users, TrendingUp, MoreHorizontal, Circle, ArrowRight, Filter, Save
} from 'lucide-react';
import { useTenant } from '@/lib/TenantContext';
import { getLeads, createLead, updateLeadStage, getPipelines, createPipeline as apiCreatePipeline, getCRMStatus, getAmoAuthUrl } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

const STAGE_COLORS: Record<string, string> = {
    won: '#22c55e', lost: '#ef4444',
    default: '#6366f1'
};
const stageColor = (name: string) =>
    name.toLowerCase().includes('won') ? STAGE_COLORS.won :
        name.toLowerCase().includes('lost') ? STAGE_COLORS.lost :
            STAGE_COLORS.default;

const CH_CFG: Record<string, { label: string; bg: string; color: string }> = {
    telegram: { label: 'TG', bg: 'rgba(41,182,246,.15)', color: '#29b6f6' },
    instagram: { label: 'IG', bg: 'rgba(233,30,99,.15)', color: '#e91e63' },
    voice: { label: 'VC', bg: 'rgba(34,197,94,.15)', color: '#22c55e' },
    chat: { label: 'CH', bg: 'rgba(139,92,246,.15)', color: '#8b5cf6' },
    web: { label: 'WEB', bg: 'rgba(249,115,22,.15)', color: '#f97316' },
};
const ch = (c: string) => CH_CFG[c] || CH_CFG.chat;

// ──────────────────────────────────────────────────────────────────────────────
export default function CRMPage() {
    const { tenantId } = useTenant();
    const { t } = useLanguage();
    const [stages, setStages] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // modals
    const [leadModal, setLeadModal] = useState<'new' | 'detail' | null>(null);
    const [automModal, setAutomModal] = useState(false);
    const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
    const [activeLeadTab, setActiveLeadTab] = useState('Main Info');
    const activeLead = leads.find(l => l.id === activeLeadId) || null;

    // new lead form
    const [form, setForm] = useState({ name: '', phone: '', email: '', value: '', stage_id: '' });
    const [saving, setSaving] = useState(false);

    // amoCRM integration
    const [amoConnected, setAmoConnected] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);

    // automations
    const [automations, setAutomations] = useState([
        { id: 'a1', trigger: 'Moved to "Contacted"', action: 'Send welcome message + AI follow-up', enabled: true },
        { id: 'a2', trigger: 'Qualified > 3 days idle', action: 'Launch AI Voice Call (outbound)', enabled: true },
        { id: 'a3', trigger: 'Moved to "Won"', action: 'Send invoice & success email', enabled: false },
    ]);

    // amoCRM state from API
    const [amoSubdomain, setAmoSubdomain] = useState<string | null>(null);
    const [connError, setConnError] = useState<string | null>(null);
    // ammoCRM auth state
    const [connectModal, setConnectModal] = useState(false);

    // Initial load & Check URL params
    useEffect(() => {
        fetchData();

        // Handle OAuth callback redirects safely without crashing Next.js
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('amo_connected') === 'true') {
                setConnectModal(false);
            } else if (params.get('amo_error')) {
                setConnError("AmoCRM ulanishda xatolik yuz berdi. Iltimos ruxsatnomalarni (keys) tekshirib qayta urinib koring.");
            }
        }
    }, [tenantId]);

    const handleStartConnect = async () => {
        setRefreshing(true);
        try {
            const res = await getAmoAuthUrl(tenantId) as any;
            if (res.url) {
                // Redirect user to amoCRM to approve the app
                window.location.href = res.url;
            }
        } catch (e) {
            alert("Error: " + e);
            setRefreshing(false);
        }
    };

    // ── data fetching ─────────────────────────────────────────────────────────
    const fetchData = async (showSpinner = false) => {
        if (showSpinner) setRefreshing(true);
        try {
            const [pData, lData, sData] = await Promise.all([
                getPipelines(tenantId) as Promise<any>,
                getLeads(tenantId) as Promise<any>,
                getCRMStatus(tenantId) as Promise<any>,
            ]);

            if (sData) {
                setAmoConnected(sData.connected);
                setLastSync(sData.last_synced_at);
                setAmoSubdomain(sData.subdomain);
            }

            if (!pData.data || pData.data.length === 0) {
                // auto-seed default pipeline
                await apiCreatePipeline(tenantId, {
                    name: 'Default Pipeline',
                    is_default: true,
                    stages: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
                });
                const refreshed = await getPipelines(tenantId) as any;
                setStages(refreshed.data?.[0]?.stages || []);
            } else {
                setStages(pData.data[0].stages || []);
            }
            if (lData.data) setLeads(lData.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); const t = setInterval(fetchData, 15000); return () => clearInterval(t); }, [tenantId]);

    // ── drag & drop ───────────────────────────────────────────────────────────
    const onDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };
    const onDrop = async (e: React.DragEvent, sid: string) => {
        e.preventDefault();
        if (!draggedId) return;
        const stage = displayStages.find(s => s.id === sid);
        setLeads(prev => prev.map(l => l.id === draggedId ? { ...l, pipeline_stage_id: sid, status: stage?.name || l.status } : l));
        setDraggedId(null); setDragOver(null);
        try {
            await updateLeadStage(tenantId, draggedId, sid);
        } catch { fetchData(); }
    };

    // ── create lead ───────────────────────────────────────────────────────────
    const handleCreateLead = async () => {
        if (!form.name) return;
        setSaving(true);
        const first = displayStages[0];
        try {
            const data = await createLead(tenantId, {
                contact_info: { name: form.name, phone: form.phone, email: form.email },
                status: first?.name || 'New',
                probability_score: 50,
                clv: parseFloat(form.value) || 0,
                pipeline_stage_id: form.stage_id || first?.id || null,
            }) as any;
            if (data) { setLeadModal(null); setForm({ name: '', phone: '', email: '', value: '', stage_id: '' }); fetchData(); }
        } finally { setSaving(false); }
    };

    // ── derived ───────────────────────────────────────────────────────────────
    const displayStages = stages.length > 0
        ? [...stages].sort((a, b) => (a.order || 0) - (b.order || 0))
        : [{ id: '__n', name: 'New', order: 0 }, { id: '__c', name: 'Contacted', order: 1 }, { id: '__q', name: 'Qualified', order: 2 }, { id: '__w', name: 'Won', order: 3 }];

    const filtered = leads.filter(l => {
        const q = search.toLowerCase();
        const name = l.contact_info?.name || l.contact_name || '';
        return !q || name.toLowerCase().includes(q) || (l.contact_info?.email || '').includes(q) || (l.contact_info?.phone || '').includes(q);
    });

    const totalPipelineValue = leads.reduce((s, l) => s + (l.clv || 0), 0);
    const totalLeads = leads.length;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading CRM Pipeline…</p>
        </div>
    );

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)', overflow: 'hidden' }}>

            {/* ══ CONDITIONAL RENDER: SETUP vs KANBAN ════════════════════════════════════ */}
            {!amoConnected ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', overflowY: 'auto' }}>
                    <div className="animate-in" style={{
                        maxWidth: 900, width: '100%', background: 'var(--bg-main)', borderRadius: 32,
                        border: '1px solid var(--border)', overflow: 'hidden',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.15)', display: 'flex'
                    }}>
                        {/* Left Side: Setup Let's Go */}
                        <div style={{ flex: 1, padding: '64px 48px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 16,
                                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 32,
                                boxShadow: '0 12px 32px rgba(59, 130, 246, 0.3)',
                            }}>
                                amo
                            </div>
                            <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                                Connect your amoCRM
                            </h1>
                            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: connError ? 24 : 48, maxWidth: 400 }}>
                                {t('integrations.amocrm_desc')} Activate 2-way sync to manage leads, view AI chat history, and automate pipeline stages directly from this dashboard.
                            </p>

                            {connError && (
                                <div style={{
                                    padding: '16px 20px', background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12,
                                    color: '#ef4444', fontSize: 14, fontWeight: 500, marginBottom: 32,
                                    display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: 400
                                }}>
                                    <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div style={{ lineHeight: 1.5 }}>
                                        {connError}
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => setConnectModal(true)}
                                style={{
                                    padding: '16px 32px', borderRadius: 12,
                                    background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', border: 'none',
                                    color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    boxShadow: '0 12px 24px rgba(59, 130, 246, 0.3)', transition: 'transform 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                            >
                                <Zap size={20} fill="#fff" />
                                {t('integrations.connect_amo_btn')}
                            </button>
                        </div>
                        {/* Right Side: Benefits */}
                        <div style={{ width: 400, background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', padding: '64px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 32 }}>What happens next?</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                {[
                                    { icon: <RefreshCw size={24} />, title: "Real-time 2-way sync", desc: "Changes in amoCRM reflect instantly here, and vice versa." },
                                    { icon: <LayoutGrid size={24} />, title: "Pipeline mapping", desc: "Your pipelines and stages are automatically imported." },
                                    { icon: <BotMessageSquare size={24} />, title: "Chat sync", desc: "AI conversations from all sources are attached to the lead card." }
                                ].map((benefit, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 16 }}>
                                        <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {benefit.icon}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{benefit.title}</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{benefit.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* ══ TOP BAR ════════════════════════════════════════════════════ */}
                    <div style={{
                        padding: '0 28px', height: 64, display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-card)', flexShrink: 0, gap: 16
                    }}>
                        {/* Left: title + stats */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                            <div>
                                <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{t('nav.crm')}</h1>
                            </div>
                            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
                            <div style={{ display: 'flex', gap: 20 }}>
                                <Stat label="Total Leads" value={totalLeads.toString()} />
                                <Stat label="Pipeline Value" value={`$${totalPipelineValue.toLocaleString()}`} accent />
                                <Stat label="Stages" value={displayStages.length.toString()} />
                            </div>
                        </div>

                        {/* Right: actions */}
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {/* search */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', height: 36 }}>
                                <Search size={13} color="var(--text-muted)" />
                                <input
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search leads&hellip;"
                                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text-primary)', width: 180 }}
                                />
                                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}><X size={13} /></button>}
                            </div>

                            <button onClick={() => fetchData(true)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                            </button>

                            <button onClick={() => setAutomModal(true)} style={{
                                display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
                                borderRadius: 8, border: '1px solid rgba(99,102,241,.4)',
                                background: 'rgba(99,102,241,.08)', color: '#818cf8',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer'
                            }}>
                                <Zap size={14} /> Automations
                            </button>

                            <button onClick={() => setLeadModal('new')} style={{
                                display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px',
                                borderRadius: 8, border: 'none',
                                background: 'var(--accent)', color: '#fff',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer'
                            }}>
                                <Plus size={15} /> New Lead
                            </button>
                        </div>
                    </div>

                    {/* ══ amoCRM SYNC BANNER ══════════════════════════════════════ */}
                    <div style={{ padding: '0 28px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{
                            padding: '16px 20px',
                            background: 'rgba(34, 197, 94, 0.05)',
                            border: '1px dashed rgba(34, 197, 94, 0.3)',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10,
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e'
                                }}>
                                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {t('integrations.connected_amo_label')}
                                        </h3>
                                        <span style={{ fontSize: 9, background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '1px 6px', borderRadius: 8, fontWeight: 800 }}>CONNECTED</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                                        {`${t('integrations.last_sync_label')}: ${lastSync ? new Date(lastSync).toLocaleTimeString() : t('integrations.never')}`}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => fetchData(true)}
                                disabled={refreshing}
                                style={{
                                    padding: '8px 16px', borderRadius: 6,
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border)',
                                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
                                }}
                            >
                                {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                {t('integrations.sync_now')}
                            </button>
                        </div>
                    </div>

                    {/* ══ KANBAN BOARD ═══════════════════════════════════════════════ */}
                    <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', gap: 0, padding: '16px 20px', paddingBottom: 0 }}>
                        {displayStages.map((stage, idx) => {
                            const sc = stageColor(stage.name);
                            const stageLeads = filtered.filter(l => l.pipeline_stage_id === stage.id || l.status === stage.name);
                            const stageValue = stageLeads.reduce((s, l) => s + (l.clv || 0), 0);
                            const isOver = dragOver === stage.id;
                            const isLast = idx === displayStages.length - 1;

                            return (
                                <div
                                    key={stage.id}
                                    style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}
                                >
                                    {/* Column */}
                                    <div
                                        style={{
                                            width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
                                            height: 'calc(100vh - 128px)',
                                            background: isOver ? `${sc}08` : 'transparent',
                                            transition: 'background 0.15s',
                                            borderRadius: 12, overflow: 'hidden',
                                            border: isOver ? `1px solid ${sc}30` : '1px solid transparent',
                                        }}
                                        onDragOver={e => { e.preventDefault(); setDragOver(stage.id); }}
                                        onDragLeave={() => setDragOver(null)}
                                        onDrop={e => onDrop(e, stage.id)}
                                    >
                                        {/* Column header */}
                                        <div style={{ padding: '12px 14px 10px', flexShrink: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stage.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: sc, background: `${sc}18`, padding: '2px 8px', borderRadius: 10 }}>{stageLeads.length}</span>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', paddingLeft: 16, marginTop: 4 }}>
                                                ${stageValue.toLocaleString()}
                                            </div>
                                            <div style={{ height: 2, background: `${sc}30`, borderRadius: 2, marginTop: 10 }}>
                                                <div style={{ height: '100%', width: `${Math.min((stageLeads.length / Math.max(totalLeads, 1)) * 100, 100)}%`, background: sc, borderRadius: 2, transition: 'width 0.4s' }} />
                                            </div>
                                        </div>

                                        {/* Cards */}
                                        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {stageLeads.map(lead => (
                                                <LeadCard
                                                    key={lead.id}
                                                    lead={lead}
                                                    stageColor={sc}
                                                    isDragging={draggedId === lead.id}
                                                    onDragStart={(e: React.DragEvent) => onDragStart(e, lead.id)}
                                                    onOpen={() => { setActiveLeadId(lead.id); setLeadModal('detail'); }}
                                                />
                                            ))}

                                            {stageLeads.length === 0 && (
                                                <div style={{
                                                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: 24, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', gap: 8,
                                                    border: `1.5px dashed ${sc}30`, borderRadius: 10, minHeight: 100
                                                }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${sc}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Plus size={16} color={sc} />
                                                    </div>
                                                    <span>Drop leads here</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    {!isLast && <div style={{ width: 1, height: 'calc(100vh - 128px)', background: 'var(--border)', margin: '0 6px', flexShrink: 0, alignSelf: 'flex-start' }} />}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ══ MODALS ═════════════════════════════════════════════════════ */}

            {/* New Lead */}
            {leadModal === 'new' && (
                <Overlay onClose={() => setLeadModal(null)}>
                    <div style={{ width: 480 }}>
                        <ModalHeader title="Create New Lead" onClose={() => setLeadModal(null)} />
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <Field label="Full Name / Company *">
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Acme Corp" style={inputStyle} />
                            </Field>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <Field label="Phone">
                                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998 90 123 45 67" style={inputStyle} />
                                </Field>
                                <Field label="Est. Value ($)">
                                    <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="5000" style={inputStyle} />
                                </Field>
                            </div>
                            <Field label="Email">
                                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contact@company.com" style={inputStyle} />
                            </Field>
                            <Field label="Pipeline Stage">
                                <select value={form.stage_id} onChange={e => setForm(p => ({ ...p, stage_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                                    <option value="">First stage (default)</option>
                                    {displayStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </Field>
                        </div>
                        <ModalFooter>
                            <button onClick={() => setLeadModal(null)} style={btnSec}>Cancel</button>
                            <button onClick={handleCreateLead} disabled={!form.name || saving} style={{ ...btnPri, opacity: !form.name || saving ? 0.6 : 1 }}>
                                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                {saving ? 'Creating…' : 'Create Lead'}
                            </button>
                        </ModalFooter>
                    </div>
                </Overlay>
            )}

            {/* Lead Detail - Enterprise Two-Column View */}
            {leadModal === 'detail' && activeLead && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    onClick={e => { if (e.target === e.currentTarget) setLeadModal(null); }}>
                    <div className="animate-in" style={{
                        width: 'calc(100vw - 120px)',
                        maxWidth: 1200,
                        height: 'calc(100vh - 80px)',
                        background: 'var(--bg-main)',
                        borderRadius: 20,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
                        overflow: 'hidden'
                    }}>
                        {/* ── Header ────────────────────────────────────────────── */}
                        <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                                    {(activeLead.contact_info?.name || activeLead.contact_name || '?').substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{activeLead.contact_info?.name || activeLead.contact_name || 'Unknown Lead'}</h2>
                                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 12, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>{activeLead.status || 'NEW'}</span>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Target size={13} /> {activeLead.channel || 'Telegram'}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> Added 2 days ago</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Star size={13} color="#f59e0b" /> VIP Potential</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button style={{ ...btnSec, background: 'var(--bg-main)', borderRadius: 10, width: 40, padding: 0, justifyContent: 'center' }}><Star size={16} /></button>
                                <button style={{ ...btnSec, background: 'var(--bg-main)', borderRadius: 10, width: 40, padding: 0, justifyContent: 'center' }}><MoreHorizontal size={18} /></button>
                                <button onClick={() => setLeadModal(null)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                            </div>
                        </div>

                        {/* ── Sub-Nav / Tabs ────────────────────────────────────── */}
                        <div style={{ padding: '0 32px', height: 48, display: 'flex', alignItems: 'center', gap: 32, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                            {['Main Info', 'Activity history', 'Statistics', 'Invoices & Files', 'Notes'].map((t) => (
                                <div
                                    key={t}
                                    onClick={() => setActiveLeadTab(t)}
                                    style={{
                                        fontSize: 13, fontWeight: activeLeadTab === t ? 700 : 500, color: activeLeadTab === t ? 'var(--accent)' : 'var(--text-muted)',
                                        cursor: 'pointer', transition: 'all 0.2s', position: 'relative', height: '100%', display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    {t}
                                    {activeLeadTab === t && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'var(--accent)', borderRadius: '2px 2px 0 0' }} />}
                                </div>
                            ))}
                        </div>

                        {/* ── Main Content Area ─────────────────────────────────── */}
                        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                            {/* Left Column: Fixed Info (Always Visible for Context) */}
                            <div style={{ width: '38%', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                                    <Section title="Primary Contact">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <InfoRow label="Mobile Phone" val={activeLead.contact_info?.phone || '—'} icon={<Phone size={14} />} />
                                            <InfoRow label="Work Email" val={activeLead.contact_info?.email || '—'} icon={<Mail size={14} />} />
                                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                <button style={{ ...btnSec, flex: 1, background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)', height: 32 }}>WhatsApp</button>
                                                <button style={{ ...btnSec, flex: 1, background: 'rgba(0,136,204,0.1)', color: '#0088cc', border: '1px solid rgba(0,136,204,0.2)', height: 32 }}>Telegram</button>
                                            </div>
                                        </div>
                                    </Section>
                                    <div style={{ height: 32 }} />
                                    <Section title="Deal Value">
                                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Budget</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>${(activeLead.clv || 0).toLocaleString()}</div>
                                        </div>
                                    </Section>
                                </div>
                                <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', gap: 12 }}>
                                    <button style={{ ...btnPri, flex: 1, height: 44 }}><Phone size={16} /> Call</button>
                                    <button style={{ ...btnSec, flex: 1, height: 44 }}><BotMessageSquare size={16} /> AI Chat</button>
                                </div>
                            </div>

                            {/* Right Column: Dynamic Content based on Tabs */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-elevated)' }}>
                                {activeLeadTab === 'Activity history' || activeLeadTab === 'Main Info' ? (
                                    <>
                                        <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                                            <input placeholder="Add a comment... (@mention team)" style={{ ...inputStyle, background: 'var(--bg-card)', height: 44 }} />
                                            <button style={{ ...btnPri, width: 44, padding: 0, justifyContent: 'center' }}><Plus size={18} /></button>
                                        </div>
                                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Communication Journal</h3>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                                    {/* Mock Activity Item */}
                                                    <div style={{ display: 'flex', gap: 24, position: 'relative' }}>
                                                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', zIndex: 1, flexShrink: 0 }}><BotMessageSquare size={20} /></div>
                                                        <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>AI ASSISTANT</span>
                                                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>10:32 AM</span>
                                                            </div>
                                                            <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>Qualifying message sent via Telegram.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : activeLeadTab === 'Statistics' ? (
                                    <div style={{ padding: 48 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Lead Performance Analytics</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Conversion Probability</div>
                                                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)' }}>{activeLead.probability_score || 0}%</div>
                                                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, marginTop: 16 }}>
                                                    <div style={{ height: '100%', width: `${activeLead.probability_score || 0}%`, background: 'var(--accent)', borderRadius: 4 }} />
                                                </div>
                                            </div>
                                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Total Interactions</div>
                                                <div style={{ fontSize: 32, fontWeight: 900 }}>14 sessions</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeLeadTab === 'Invoices & Files' ? (
                                    <div style={{ padding: 48 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Documents & Assets</h3>
                                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                                            <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}><Search size={48} style={{ opacity: 0.2 }} /></div>
                                            <p style={{ color: 'var(--text-secondary)' }}>No invoices or files found for this lead.</p>
                                            <button style={{ ...btnSec, margin: '20px auto' }}>+ Upload Document</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: 48 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Internal Notes</h3>
                                        <textarea
                                            placeholder="Write your observation about this lead here..."
                                            style={{ ...inputStyle, height: 300, padding: 20, resize: 'none', background: 'var(--bg-card)' }}
                                        />
                                        <button style={{ ...btnPri, marginTop: 24 }}>Save Note</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* amoCRM Connect Modal - Enterprise Redesign */}
            {connectModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => { if (e.target === e.currentTarget && !saving && !refreshing) setConnectModal(false); }}>
                    <div className="animate-in" style={{
                        width: 480, background: 'var(--bg-main)', borderRadius: 24,
                        border: '1px solid var(--border)', padding: '48px 40px',
                        boxShadow: '0 40px 80px rgba(0,0,0,0.5)', textAlign: 'center',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setConnectModal(false)}
                            style={{ position: 'absolute', top: 24, right: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{
                            width: 80, height: 80, borderRadius: 20,
                            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 auto 24px',
                            boxShadow: '0 12px 32px rgba(59, 130, 246, 0.3)',
                        }}>
                            amo
                        </div>

                        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
                            {t('integrations.connect_amo_btn')}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
                            {t('integrations.amocrm_desc')} Bossangiz, xavfsiz ulanish uchun amoCRM saytiga yo'naltirilasiz.
                        </p>

                        <button
                            onClick={handleStartConnect}
                            disabled={refreshing}
                            style={{
                                width: '100%', padding: '16px',
                                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                                border: 'none', borderRadius: 12,
                                color: '#fff', fontWeight: 800, fontSize: 15,
                                cursor: refreshing ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                opacity: refreshing ? 0.7 : 1,
                                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.25)',
                            }}
                        >
                            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            {refreshing ? "Yo'naltirilmoqda..." : "amoCRM bilan ulanish"}
                        </button>
                    </div>
                </div>
            )}

            {/* Automation Studio (Vo'ronka) - Visual Grid Layout */}
            {
                automModal && (
                    <Overlay onClose={() => setAutomModal(false)}>
                        <div style={{ width: 'calc(100vw - 160px)', maxWidth: 1100, height: '85vh', display: 'flex', flexDirection: 'column' }}>
                            <ModalHeader
                                title="Automation Studio"
                                subtitle="Configure AI triggers and webhooks for each pipeline stage"
                                icon={<Zap size={18} />}
                                iconBg="rgba(99,102,241,.15)"
                                iconColor="#818cf8"
                                onClose={() => setAutomModal(false)}
                            />

                            <div style={{ flex: 1, padding: '32px', overflowX: 'auto', background: 'var(--bg-elevated)' }}>
                                <div style={{ display: 'flex', gap: 24, height: '100%' }}>
                                    {displayStages.map(stage => {
                                        const sc = stageColor(stage.name);
                                        const stageAutomations = automations.filter(a => a.trigger.includes(stage.name));

                                        return (
                                            <div key={stage.id} style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                {/* Stage Label */}
                                                <div style={{ padding: '0 12px' }}>
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: sc, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{stage.name}</div>
                                                    <div style={{ height: 3, width: 40, background: sc, borderRadius: 2 }} />
                                                </div>

                                                {/* Trigger Column */}
                                                <div style={{
                                                    flex: 1,
                                                    background: 'rgba(255,255,255,0.02)',
                                                    borderRadius: 16,
                                                    border: '1px dashed var(--border)',
                                                    padding: 12,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 12
                                                }}>
                                                    {stageAutomations.map(a => (
                                                        <div key={a.id} style={{
                                                            background: 'var(--bg-card)',
                                                            border: '1px solid var(--border)',
                                                            borderRadius: 12,
                                                            padding: 16,
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                            position: 'relative'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                                                                    <Zap size={12} /> AI ACTION
                                                                </div>
                                                                <Toggle
                                                                    on={a.enabled}
                                                                    onChange={() => setAutomations(prev => prev.map(x => x.id === a.id ? { ...x, enabled: !x.enabled } : x))}
                                                                />
                                                            </div>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{a.action}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <Clock size={10} /> Instant execution
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Add Trigger Placeholder */}
                                                    <button style={{
                                                        width: '100%',
                                                        padding: '16px',
                                                        borderRadius: 12,
                                                        border: '1px dashed var(--border)',
                                                        background: 'transparent',
                                                        color: 'var(--text-muted)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        transition: 'all 0.2s'
                                                    }} onMouseOver={e => e.currentTarget.style.borderColor = sc} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Plus size={16} />
                                                        </div>
                                                        <span style={{ fontSize: 11, fontWeight: 700 }}>Add trigger</span>
                                                    </button>
                                                </div>

                                                {/* Stage Hint */}
                                                <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    TIP: Add an AI task to qualify leads automatically when they arrive.
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <ModalFooter>
                                <button onClick={() => setAutomModal(false)} style={btnSec}>Back to Pipeline</button>
                                <button onClick={() => setAutomModal(false)} style={btnPri}><Save size={14} /> Save Configuration</button>
                            </ModalFooter>
                        </div>
                    </Overlay>
                )
            }
        </div >
    );
}

// ── sub-components ─────────────────────────────────────────────────────────────

function LeadCard({ lead, stageColor: sc, isDragging, onDragStart, onOpen }: any) {
    const cfg = ch(lead.channel || 'chat');
    const name = lead.contact_info?.name || lead.contact_name || 'Unknown';
    const contact = lead.contact_info?.phone || lead.contact_info?.email || '';
    const prob = lead.probability_score || 0;
    const probColor = prob > 70 ? '#22c55e' : prob > 40 ? '#f97316' : '#ef4444';
    const [hov, setHov] = useState(false);

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: 'var(--bg-card)',
                border: `1px solid ${hov ? sc + '50' : 'var(--border)'}`,
                borderRadius: 10, padding: '14px', cursor: 'grab',
                opacity: isDragging ? 0.35 : 1,
                transform: hov ? 'translateY(-2px)' : 'none',
                boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.12)` : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
                position: 'relative', overflow: 'hidden'
            }}
        >
            {/* stage accent left line */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: sc, borderRadius: '3px 0 0 3px' }} />

            <div style={{ paddingLeft: 8 }}>
                {/* Name row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{name}</div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {lead.pipeline_stage_id && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>amo</span>}
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
                    </div>
                </div>

                {contact && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact}</div>
                )}

                {/* Value + AI prob row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
                        <DollarSign size={11} /> {(lead.clv || 0).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {lead.probability_score !== undefined && (
                            <div style={{
                                fontSize: 11, fontWeight: 700, color: probColor,
                                background: `${probColor}15`, padding: '2px 8px', borderRadius: 6
                            }}>{prob.toFixed(0)}%</div>
                        )}
                        <button
                            onClick={e => { e.stopPropagation(); onOpen(); }}
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <ArrowUpRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</div>
        </div>
    );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
    return (
        <button onClick={onChange} style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: on ? '#22c55e' : 'var(--bg-main)', position: 'relative', transition: 'background 0.2s', flexShrink: 0
        }}>
            <div style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
        </button>
    );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="animate-in" style={{ background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    );
}

function ModalHeader({ title, subtitle, icon, iconBg, iconColor, onClose }: any) {
    return (
        <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {icon && (
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg || 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor || 'var(--accent)' }}>
                        {icon}
                    </div>
                )}
                <div>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{title}</div>
                    {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
                </div>
            </div>
            <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={15} /></button>
        </div>
    );
}

function ModalFooter({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            {children}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
            {children}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{title}</div>
            {children}
        </div>
    );
}

function InfoRow({ label, val, icon }: any) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 6, border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--text-muted)' }}>{icon}</div>
            <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
            </div>
        </div>
    );
}

function StatusPill({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 8, background: `${color}18`, color }}>{children}</span>
    );
}

function Timeline({ items }: { items: { time: string; text: string; dot: string }[] }) {
    return (
        <div style={{ position: 'relative', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ position: 'absolute', left: 20, top: 8, bottom: 8, width: 1.5, background: 'var(--border)' }} />
            {items.map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: it.dot, border: '2px solid var(--bg-card)', flexShrink: 0, marginTop: 5 }} />
                    <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{it.time}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{it.text}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── shared styles ──────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-main)',
    color: 'var(--text-primary)', outline: 'none', fontSize: 14,
    boxSizing: 'border-box'
};

const btnPri: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    height: 36, padding: '0 16px', borderRadius: 8,
    border: 'none', background: 'var(--accent)', color: '#fff',
    fontSize: 13, fontWeight: 700, cursor: 'pointer'
};

const btnSec: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    height: 36, padding: '0 14px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-elevated)',
    color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer'
};
