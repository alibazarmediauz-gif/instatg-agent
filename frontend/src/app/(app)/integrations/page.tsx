'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { useLanguage } from '@/lib/LanguageContext';
import {
    ArrowRight, Check, X, RefreshCw, Settings, Zap,
    AlertTriangle, CheckCircle, ChevronRight, Plus, AlertCircle, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ─── Types ───────────────────────────────────────────── */
interface CRMStatusData {
    connected: boolean;
    total_leads: number;
    pipeline: Record<string, number>;
    last_synced_at: string | null;
    sync_errors: number;
    events_per_minute: number;
}

interface CRMLead {
    id: string;
    amocrm_lead_id: string;
    contact_name: string;
    channel: string | null;
    stage: string | null;
    last_synced_at: string | null;
    sync_error: string | null;
}

const STAGE_COLORS: Record<string, string> = {
    new: '#3b82f6',
    in_progress: '#f59e0b',
    qualified: '#8b5cf6',
    won: '#22c55e',
    lost: '#ef4444',
    follow_up: '#06b6d4',
};

// ── Integration Data with Brand Colors (AmoCRM Style) ─────────────────────────
const SOURCES = [
    { id: 'whatsapp', name: 'WhatsApp', icon: '📱', color: '#25D366', type: 'messenger', desc: 'Sync WhatsApp chats & automate with AI agents.' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', color: '#0088cc', type: 'messenger', desc: 'Connect Telegram bots or business accounts.' },
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', type: 'social', desc: 'Monitor IG DMs and comments automatically.' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook', iconText: 'fb', color: '#1877F2', type: 'social', desc: 'Connect Facebook Pages for sales automation.' },
    { id: 'vk', name: 'VKontakte', icon: 'vk', iconText: 'VK', color: '#4C75A3', type: 'social', desc: 'Popular CIS social network integration.' },
    { id: 'viber', name: 'Viber', icon: '💬', color: '#7360f2', type: 'messenger', desc: 'Automate customer support on Viber.' },
    { id: 'avito', name: 'Avito', icon: '🏷️', color: '#01AAFF', type: 'marketplace', desc: 'Sync marketplace leads to your CRM pipeline.' },
    { id: 'wechat', name: 'WeChat', icon: '💹', color: '#07C160', type: 'messenger', desc: 'Global messaging for international sales.' },
    { id: 'forms', name: 'Form Builder', icon: '📝', color: '#3b82f6', type: 'tool', desc: 'Create custom forms to capture leads.' },
    { id: 'plugin', name: 'CRM Plugin', icon: '🔌', color: '#4285F4', type: 'tool', desc: 'Embeddable widgets for your website.' },
    { id: 'site', name: 'Business Card', icon: '🌐', color: '#4B7BEC', type: 'tool', desc: 'AI-powered landing page for your lead gen.' },
    { id: 'emails', name: 'Email Sync', icon: '📧', color: '#3867d6', type: 'tool', desc: 'Auto-process incoming sales emails.' },
];

export default function IntegrationsPage() {
    const { tenantId } = useTenant();
    const { t } = useLanguage();
    const router = useRouter();

    const [status, setStatus] = useState<CRMStatusData | null>(null);
    const [leads, setLeads] = useState<CRMLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [offline, setOffline] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [connectedStates, setConnectedStates] = useState<Record<string, boolean>>({
        meta: true, telegram: true, phone: false, amocrm: false,
    });
    const [activeIntegration, setActiveIntegration] = useState<string | null>(null);
    const [subdomain, setSubdomain] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const api = await import('@/lib/api');
                const [s, l] = await Promise.all([
                    api.getCRMStatus(tenantId) as Promise<CRMStatusData>,
                    api.getCRMLeads(tenantId) as Promise<{ leads: CRMLead[] }>,
                ]);
                setStatus(s);
                setLeads(l.leads || []);
            } catch { setOffline(true); } finally { setLoading(false); }
        }
        load();
    }, [tenantId]);

    const activeIntegData = SOURCES.find(s => s.id === activeIntegration) || SOURCES[0];

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
    );

    return (
        <div className="page-container animate-in" style={{ padding: '0 40px 40px' }}>
            {/* ── Page Header ────────────────────────────────────────────── */}
            <div style={{ marginBottom: 40, paddingTop: 40, borderBottom: '1px solid var(--border)', paddingBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>Lead Sources</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Connect messengers, social networks and tools to capture leads directly into your pipeline.</p>
            </div>

            {/* ── Sources Grid Gallery ───────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
                {SOURCES.map(source => {
                    const isImplemented = ['telegram', 'instagram', 'facebook'].includes(source.id);
                    return (
                        <div
                            key={source.id}
                            onClick={() => {
                                if (isImplemented) {
                                    router.push(`/settings?tab=${source.id}`);
                                } else {
                                    setActiveIntegration(source.id);
                                }
                            }}
                            style={{
                                background: source.color,
                                height: 140,
                                borderRadius: 16,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                                opacity: isImplemented ? 1 : 0.65
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; }}
                        >
                            {/* Status Dot */}
                            {isImplemented && <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#fff', opacity: connectedStates[source.id] ? 1 : 0.4 }} />}

                            {!isImplemented && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '4px', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: 10, fontWeight: 800, textAlign: 'center', textTransform: 'uppercase' }}>
                                    Coming Soon
                                </div>
                            )}

                            <div style={{ fontSize: 32, color: '#fff', marginBottom: 12, fontWeight: 900 }}>
                                {source.iconText ? <span style={{ textTransform: 'uppercase' }}>{source.iconText}</span> : source.icon}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{source.name}</div>

                            {isImplemented && (
                                <button style={{
                                    marginTop: 12,
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '4px 12px',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: '#fff',
                                    cursor: 'pointer'
                                }}>
                                    {connectedStates[source.id] ? 'Settings' : 'Add'}
                                </button>
                            )}
                        </div>
                    );
                })}

                {/* Custom Webhook / Empty slot */}
                <div style={{
                    height: 140, borderRadius: 16, border: '2px dashed var(--border)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-muted)'
                }}>
                    <Plus size={24} />
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>Add Website</div>
                </div>
            </div>

            {/* ── Integration Detail Modal (Enterprise Two-Column) ────────── */}
            {activeIntegration && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => { if (e.target === e.currentTarget) setActiveIntegration(null); }}>

                    <div className="animate-in" style={{
                        width: 'calc(100vw - 120px)',
                        maxWidth: 960,
                        height: '75vh',
                        background: 'var(--bg-main)',
                        borderRadius: 24,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        overflow: 'hidden',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.5)'
                    }}>
                        {/* Left Side: Brand & Action */}
                        <div style={{ width: 340, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', padding: '48px 32px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                                width: 140, height: 140, background: activeIntegData.color, borderRadius: 24,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#fff',
                                marginBottom: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                            }}>
                                {activeIntegData.iconText ? <span style={{ textTransform: 'uppercase' }}>{activeIntegData.iconText}</span> : activeIntegData.icon}
                            </div>

                            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>{activeIntegData.name}</h2>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
                                {activeIntegData.desc} Receive messages from clients directly in your CRM and respond manually or via AI.
                            </p>

                            <div style={{ flex: 1 }} />

                            <button style={{
                                padding: '16px 24px', background: 'var(--accent)', border: 'none', opacity: 0.5,
                                borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                            }} disabled>
                                Not Available Yet
                            </button>
                        </div>

                        {/* Right Side: Features & Screenshots */}
                        <div style={{ flex: 1, padding: '48px', position: 'relative', background: 'var(--bg-elevated)' }}>
                            <button
                                onClick={() => setActiveIntegration(null)}
                                style={{ position: 'absolute', top: 24, right: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <X size={20} />
                            </button>

                            <div style={{ maxWidth: 500 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>How it works</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    {[
                                        { title: 'Unlimited Messages', desc: 'No limits on incoming or outgoing messages through this channel.' },
                                        { title: 'Full AI Automation', desc: 'AI agents can handle 100% of chats or handoff to humans.' },
                                        { title: 'Rich Media Support', desc: 'Sync images, voice messages, and files directly to lead cards.' }
                                    ].map((f, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 16 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                                                <CheckCircle size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                                                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: 48 }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Preview</div>
                                    <div style={{ width: '100%', height: 240, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <Zap size={32} color="var(--accent)" style={{ opacity: 0.3 }} />
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>Visual preview loading...</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
