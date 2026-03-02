'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { useLanguage } from '@/lib/LanguageContext';
import {
    ArrowRight, Check, X, RefreshCw, Settings, Zap,
    AlertTriangle, CheckCircle, ChevronRight, Plus, AlertCircle, Loader2,
    Shield, ExternalLink, Unplug, Activity, Wifi, WifiOff
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

/* ─── Types ───────────────────────────────────────────── */

interface MetaAccountInfo {
    id: string;
    page_id?: string;
    page_name?: string;
    instagram_user_id?: string;
    username?: string;
    ig_username?: string;
    connection_status: string;
    token_expires_at: string | null;
    granted_scopes: string[] | null;
    last_webhook_at: string | null;
    created_at: string | null;
}

interface MetaPlatformStatus {
    connected: boolean;
    status: string;
    count: number;
    accounts: MetaAccountInfo[];
}

interface MetaStatus {
    facebook: MetaPlatformStatus;
    instagram: MetaPlatformStatus;
    last_event_at: string | null;
}

interface CRMStatusData {
    connected: boolean;
    total_leads: number;
    pipeline: Record<string, number>;
    last_synced_at: string | null;
    sync_errors: number;
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

// ── Integration Data with Brand Colors ─────────────────────────────
const SOURCES = [
    { id: 'whatsapp', name: 'WhatsApp', icon: '📱', color: '#25D366', type: 'messenger', desc: 'Sync WhatsApp chats & automate with AI agents.' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', color: '#0088cc', type: 'messenger', desc: 'Connect Telegram bots or business accounts.' },
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', type: 'social', desc: 'Monitor IG DMs and comments automatically.', metaProvider: 'instagram' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook', iconText: 'fb', color: '#1877F2', type: 'social', desc: 'Connect Facebook Pages for sales automation.', metaProvider: 'facebook' },
    { id: 'vk', name: 'VKontakte', icon: 'vk', iconText: 'VK', color: '#4C75A3', type: 'social', desc: 'Popular CIS social network integration.' },
    { id: 'viber', name: 'Viber', icon: '💬', color: '#7360f2', type: 'messenger', desc: 'Automate customer support on Viber.' },
    { id: 'avito', name: 'Avito', icon: '🏷️', color: '#01AAFF', type: 'marketplace', desc: 'Sync marketplace leads to your CRM pipeline.' },
    { id: 'wechat', name: 'WeChat', icon: '💹', color: '#07C160', type: 'messenger', desc: 'Global messaging for international sales.' },
    { id: 'forms', name: 'Form Builder', icon: '📝', color: '#3b82f6', type: 'tool', desc: 'Create custom forms to capture leads.' },
    { id: 'plugin', name: 'CRM Plugin', icon: '🔌', color: '#4285F4', type: 'tool', desc: 'Embeddable widgets for your website.' },
    { id: 'site', name: 'Business Card', icon: '🌐', color: '#4B7BEC', type: 'tool', desc: 'AI-powered landing page for your lead gen.' },
    { id: 'emails', name: 'Email Sync', icon: '📧', color: '#3867d6', type: 'tool', desc: 'Auto-process incoming sales emails.' },
];

function IntegrationsPageContent() {
    const { tenantId } = useTenant();
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
    const [activeIntegration, setActiveIntegration] = useState<string | null>(null);
    const [settingsModal, setSettingsModal] = useState<string | null>(null);
    const [connectModal, setConnectModal] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [healthResult, setHealthResult] = useState<Record<string, any> | null>(null);
    const [healthLoading, setHealthLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // ── Telegram Modal State ──
    const [telegramTab, setTelegramTab] = useState<'bot' | 'personal'>('bot');
    const [telegramStep, setTelegramStep] = useState<'phone' | 'otp' | '2fa'>('phone');
    const [telegramToken, setTelegramToken] = useState('');
    const [telegramPhone, setTelegramPhone] = useState('');
    const [telegramOtp, setTelegramOtp] = useState('');
    const [telegramPassword, setTelegramPassword] = useState('');
    const [telegramPhoneHash, setTelegramPhoneHash] = useState('');

    // ── Data Loading ──
    const loadStatus = useCallback(async () => {
        try {
            setLoading(true);
            const api = await import('@/lib/api');
            const status = await api.getMetaIntegrationStatus(tenantId) as MetaStatus;
            setMetaStatus(status);
        } catch {
            // Fallback if API unavailable
            setMetaStatus({
                facebook: { connected: false, status: 'disconnected', count: 0, accounts: [] },
                instagram: { connected: false, status: 'disconnected', count: 0, accounts: [] },
                last_event_at: null,
            });
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    // ── Toast from URL params (after OAuth redirect) ──
    useEffect(() => {
        const connected = searchParams.get('connected');
        const error = searchParams.get('error');

        if (connected) {
            setToast({ message: `✅ ${connected.replace(',', ' + ')} connected successfully!`, type: 'success' });
            loadStatus();
            // Clean URL
            window.history.replaceState({}, '', '/integrations');
        } else if (error) {
            setToast({ message: `❌ Connection failed: ${error.replace(/_/g, ' ')}`, type: 'error' });
            window.history.replaceState({}, '', '/integrations');
        }
    }, [searchParams, loadStatus]);

    // ── Auto-dismiss toast ──
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // ── Connection helpers ──
    const isConnected = (sourceId: string) => {
        if (!metaStatus) return false;
        if (sourceId === 'instagram') return metaStatus.instagram?.connected;
        if (sourceId === 'facebook') return metaStatus.facebook?.connected;
        if (sourceId === 'telegram') return true; // Handled separately
        return false;
    };

    const getStatusColor = (sourceId: string) => {
        if (!metaStatus) return '#888';
        const platform = sourceId === 'instagram' ? metaStatus.instagram : sourceId === 'facebook' ? metaStatus.facebook : null;
        if (!platform) return sourceId === 'telegram' ? '#22c55e' : '#888';
        if (!platform.connected) return '#888';
        if (platform.status === 'error') return '#ef4444';
        if (platform.status === 'needs_review') return '#f59e0b';
        return '#22c55e';
    };

    const getStatusLabel = (sourceId: string) => {
        if (!metaStatus) return '';
        const platform = sourceId === 'instagram' ? metaStatus.instagram : sourceId === 'facebook' ? metaStatus.facebook : null;
        if (!platform || !platform.connected) return '';
        const acc = platform.accounts[0];
        if (sourceId === 'instagram' && acc?.username) return `@${acc.username}`;
        if (sourceId === 'facebook' && acc?.page_name) return acc.page_name;
        return 'Connected';
    };

    const handleConnect = async (provider: string) => {
        setConnecting(true);
        try {
            // Direct redirect to backend OAuth endpoint
            const API_URL = process.env.NEXT_PUBLIC_API_URL ||
                (process.env.NODE_ENV === 'production'
                    ? 'https://instatg-agent-production.up.railway.app'
                    : 'http://localhost:8000');
            window.location.href = `${API_URL}/api/integrations/meta/connect?tenant_id=${tenantId}&provider=${provider}`;
        } catch {
            setToast({ message: '❌ Failed to start connection. Check backend.', type: 'error' });
            setConnecting(false);
        }
    };

    const handleDisconnect = async (provider: string) => {
        if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;
        setDisconnecting(true);
        try {
            const api = await import('@/lib/api');
            if (provider === 'telegram') {
                await api.disconnectTelegram(tenantId);
            } else {
                await api.disconnectMetaIntegration(tenantId, provider);
            }
            setToast({ message: `${provider} disconnected.`, type: 'success' });
            setSettingsModal(null);
            await loadStatus();
        } catch {
            setToast({ message: '❌ Disconnect failed.', type: 'error' });
        } finally {
            setDisconnecting(false);
        }
    };

    const handleHealthCheck = async () => {
        setHealthLoading(true);
        setHealthResult(null);
        try {
            const api = await import('@/lib/api');
            if (settingsModal === 'telegram') {
                setHealthResult({ error: 'Health ping not supported for MTProto' });
            } else {
                const result = await api.checkMetaHealth(tenantId);
                setHealthResult(result as Record<string, any>);
            }
        } catch {
            setHealthResult({ error: 'Health check failed' });
        } finally {
            setHealthLoading(false);
        }
    };

    const getConnectedAccounts = (provider: string): MetaAccountInfo[] => {
        if (!metaStatus) return [];
        if (provider === 'instagram') return metaStatus.instagram?.accounts || [];
        if (provider === 'facebook') return metaStatus.facebook?.accounts || [];
        if (provider === 'telegram') {
            // Fake a meta info structure for UI compatibility
            return [{
                page_id: 'telegram',
                page_name: 'Pyrogram Business',
                username: 'Unknown TG',
                connection_status: 'connected',
                created_at: new Date().toISOString()
            } as any];
        }
        return [];
    };

    // ── Badge Counts ──
    const tgCount = 1; // Telegram is always managed separately
    const igCount = metaStatus?.instagram?.count || 0;
    const fbCount = metaStatus?.facebook?.count || 0;

    const isImplemented = (id: string) => ['telegram', 'instagram', 'facebook'].includes(id);
    const activeIntegData = SOURCES.find(s => s.id === activeIntegration) || SOURCES[0];

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
    );

    return (
        <div className="page-container animate-in" style={{ padding: '0 40px 40px' }}>

            {/* ── Toast Notification ──────────────────────────── */}
            {toast && (
                <div
                    className="animate-in"
                    style={{
                        position: 'fixed', top: 24, right: 24, zIndex: 9999,
                        padding: '14px 24px', borderRadius: 12,
                        background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        color: toast.type === 'success' ? '#22c55e' : '#ef4444',
                        fontSize: 14, fontWeight: 700,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}
                >
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                    <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 8 }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── Page Header ────────────────────────────────── */}
            <div style={{ marginBottom: 40, paddingTop: 40, borderBottom: '1px solid var(--border)', paddingBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>Lead Sources</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Connect messengers, social networks and tools to capture leads directly into your pipeline.</p>
                </div>

                {/* Connected badge */}
                <div style={{
                    display: 'flex', gap: 8, alignItems: 'center',
                    padding: '8px 16px', borderRadius: 10,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)'
                }}>
                    {tgCount > 0 && <span style={{ color: '#0088cc' }}>{tgCount} TG</span>}
                    {igCount > 0 && <><span style={{ opacity: 0.3 }}>•</span><span style={{ color: '#dc2743' }}>{igCount} IG</span></>}
                    {fbCount > 0 && <><span style={{ opacity: 0.3 }}>•</span><span style={{ color: '#1877F2' }}>{fbCount} FB</span></>}
                    <Wifi size={14} style={{ color: '#22c55e', marginLeft: 4 }} />
                </div>
            </div>

            {/* ── Sources Grid ───────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                {SOURCES.map(source => {
                    const implemented = isImplemented(source.id);
                    const connected = isConnected(source.id);
                    const statusColor = getStatusColor(source.id);
                    const statusLabel = getStatusLabel(source.id);

                    return (
                        <div
                            key={source.id}
                            onClick={() => {
                                if (!implemented) {
                                    setActiveIntegration(source.id);
                                } else if (source.id === 'telegram') {
                                    setConnectModal('telegram');
                                } else if (connected) {
                                    setSettingsModal(source.id);
                                } else {
                                    setConnectModal(source.id);
                                }
                            }}
                            style={{
                                background: source.color,
                                height: 160,
                                borderRadius: 16,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                overflow: 'hidden',
                                opacity: implemented ? 1 : 0.6
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.25)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'; }}
                        >
                            {/* Status Dot */}
                            {implemented && (
                                <div style={{
                                    position: 'absolute', top: 12, right: 12,
                                    width: 10, height: 10, borderRadius: '50%',
                                    background: statusColor,
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    boxShadow: connected ? `0 0 8px ${statusColor}` : 'none',
                                }} />
                            )}

                            {!implemented && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0,
                                    padding: '4px', background: 'rgba(0,0,0,0.45)',
                                    color: 'white', fontSize: 10, fontWeight: 800,
                                    textAlign: 'center', textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Coming Soon
                                </div>
                            )}

                            <div style={{ fontSize: 36, color: '#fff', marginBottom: 10, fontWeight: 900 }}>
                                {source.iconText ? <span style={{ textTransform: 'uppercase' }}>{source.iconText}</span> : source.icon}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{source.name}</div>

                            {/* Status label for connected accounts */}
                            {connected && statusLabel && (
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: 600 }}>
                                    {statusLabel}
                                </div>
                            )}

                            {implemented && (
                                <button style={{
                                    marginTop: 10,
                                    background: connected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '5px 16px',
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    transition: 'all 0.15s',
                                }}>
                                    {connected
                                        ? <><Settings size={13} /> Settings</>
                                        : <><Plus size={13} /> Add</>
                                    }
                                </button>
                            )}
                        </div>
                    );
                })}

                {/* Custom Webhook / Empty slot */}
                <div style={{
                    height: 160, borderRadius: 16, border: '2px dashed var(--border)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-muted)',
                    transition: 'all 0.2s',
                }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                    <Plus size={24} />
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>Add Website</div>
                </div>
            </div>

            {/* ── Connect Modal (OAuth Start) ─────────────── */}
            {connectModal && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => { if (e.target === e.currentTarget && !connecting) setConnectModal(null); }}
                >
                    <div className="animate-in" style={{
                        width: 440, background: 'var(--bg-main)', borderRadius: 24,
                        border: '1px solid var(--border)', padding: '48px 40px',
                        boxShadow: '0 40px 80px rgba(0,0,0,0.5)', textAlign: 'center',
                    }}>
                        {/* Brand icon */}
                        {(() => {
                            const source = SOURCES.find(s => s.id === connectModal);
                            if (!source) return null;
                            return (
                                <div style={{
                                    width: 80, height: 80, borderRadius: 20,
                                    background: source.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 36, color: '#fff', margin: '0 auto 24px',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                                }}>
                                    {source.iconText ? <span style={{ textTransform: 'uppercase', fontWeight: 900 }}>{source.iconText}</span> : source.icon}
                                </div>
                            );
                        })()}

                        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
                            Connect {connectModal === 'instagram' ? 'Instagram' : 'Facebook'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
                            You&#39;ll be redirected to Meta to authorize access.
                            We&#39;ll request permissions for messaging, comments, and page management.
                        </p>

                        {/* Scopes preview */}
                        <div style={{
                            background: 'var(--bg-card)', borderRadius: 12, padding: '16px 20px',
                            border: '1px solid var(--border)', marginBottom: 32, textAlign: 'left',
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                                Permissions Required
                            </div>
                            {[
                                { icon: '💬', label: 'Read & send messages' },
                                { icon: '📝', label: 'Manage comments' },
                                { icon: '📄', label: 'Page metadata access' },
                                { icon: '📊', label: 'Page engagement insights' },
                            ].map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <span>{p.icon}</span>
                                    <span>{p.label}</span>
                                    <Shield size={12} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setConnectModal(null)}
                                disabled={connecting}
                                style={{
                                    flex: 1, padding: '14px', background: 'var(--bg-card)',
                                    border: '1px solid var(--border)', borderRadius: 12,
                                    color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleConnect(connectModal)}
                                disabled={connecting}
                                style={{
                                    flex: 2, padding: '14px',
                                    background: connectModal === 'instagram'
                                        ? 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)'
                                        : '#1877F2',
                                    border: 'none', borderRadius: 12,
                                    color: '#fff', fontWeight: 800, fontSize: 14,
                                    cursor: connecting ? 'wait' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    opacity: connecting ? 0.7 : 1,
                                }}
                            >
                                {connecting ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
                                {connecting ? 'Redirecting...' : 'Connect with Meta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Telegram Connect Modal ─────────────── */}
            {connectModal === 'telegram' && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => { if (e.target === e.currentTarget && !connecting) setConnectModal(null); }}
                >
                    <div className="animate-in" style={{
                        width: 440, background: 'var(--bg-main)', borderRadius: 24,
                        border: '1px solid var(--border)', padding: '48px 40px',
                        boxShadow: '0 40px 80px rgba(0,0,0,0.5)', textAlign: 'center',
                    }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 20,
                            background: '#0088cc',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 36, color: '#fff', margin: '0 auto 24px',
                            boxShadow: '0 12px 32px rgba(0,136,204,0.3)',
                        }}>
                            ✈️
                        </div>

                        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
                            Connect Telegram Bot
                        </h2>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg-elevated)', padding: 4, borderRadius: 12 }}>
                            <button
                                onClick={() => { setTelegramTab('bot'); setTelegramStep('phone'); }}
                                style={{
                                    flex: 1, padding: '8px', fontSize: 13, fontWeight: 700,
                                    borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                    background: telegramTab === 'bot' ? 'var(--bg-card)' : 'transparent',
                                    color: telegramTab === 'bot' ? 'var(--text-primary)' : 'var(--text-muted)',
                                    boxShadow: telegramTab === 'bot' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Bot Token
                            </button>
                            <button
                                onClick={() => setTelegramTab('personal')}
                                style={{
                                    flex: 1, padding: '8px', fontSize: 13, fontWeight: 700,
                                    borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                    background: telegramTab === 'personal' ? 'var(--bg-card)' : 'transparent',
                                    color: telegramTab === 'personal' ? 'var(--text-primary)' : 'var(--text-muted)',
                                    boxShadow: telegramTab === 'personal' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Personal Account
                            </button>
                        </div>

                        {telegramTab === 'bot' && (
                            <>
                                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                                    Enter your Telegram Bot Token below. You can get this from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>@BotFather</a> in Telegram.
                                </p>
                                <div style={{ textAlign: 'left', marginBottom: 24 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Bot Token</label>
                                    <input
                                        type="text"
                                        value={telegramToken}
                                        onChange={(e) => setTelegramToken(e.target.value)}
                                        placeholder="Paste your 123456:ABC-DEF1234... token here"
                                        style={{
                                            width: '100%', padding: '12px 16px', borderRadius: 12,
                                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                            color: 'var(--text-primary)', outline: 'none',
                                            fontSize: 14, fontFamily: 'monospace'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        onClick={() => setConnectModal(null)}
                                        disabled={connecting}
                                        style={{
                                            flex: 1, padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
                                            color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                        }}
                                    >Cancel</button>
                                    <button
                                        onClick={async () => {
                                            if (!telegramToken.trim()) return;
                                            setConnecting(true);
                                            try {
                                                const api = await import('@/lib/api');
                                                await api.connectTelegramBot(tenantId, telegramToken.trim());
                                                setToast({ message: '✅ Telegram Bot connected!', type: 'success' });
                                                setConnectModal(null);
                                                loadStatus();
                                            } catch (e: any) {
                                                setToast({ message: `❌ Failed to connect: ${e.message}`, type: 'error' });
                                            } finally {
                                                setConnecting(false);
                                            }
                                        }}
                                        disabled={connecting || !telegramToken.trim()}
                                        style={{
                                            flex: 2, padding: '14px', background: '#0088cc', border: 'none', borderRadius: 12,
                                            color: '#fff', fontWeight: 800, fontSize: 14, cursor: connecting || !telegramToken.trim() ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: connecting || !telegramToken.trim() ? 0.7 : 1,
                                        }}
                                    >
                                        {connecting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Token
                                    </button>
                                </div>
                            </>
                        )}

                        {telegramTab === 'personal' && (
                            <>
                                {telegramStep === 'phone' && (
                                    <>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                                            Connect your personal Telegram account to allow the AI agent to reply to direct messages automatically. Enter your phone number with country code.
                                        </p>
                                        <div style={{ textAlign: 'left', marginBottom: 24 }}>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Phone Number</label>
                                            <input
                                                type="text"
                                                value={telegramPhone}
                                                onChange={(e) => setTelegramPhone(e.target.value)}
                                                placeholder="+1234567890"
                                                style={{
                                                    width: '100%', padding: '12px 16px', borderRadius: 12,
                                                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                                    color: 'var(--text-primary)', outline: 'none',
                                                    fontSize: 16, fontFamily: 'monospace', letterSpacing: '1px'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button
                                                onClick={() => setConnectModal(null)}
                                                disabled={connecting}
                                                style={{ flex: 1, padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                                            >Cancel</button>
                                            <button
                                                onClick={async () => {
                                                    if (!telegramPhone.trim()) return;
                                                    setConnecting(true);
                                                    try {
                                                        const api = await import('@/lib/api');
                                                        const res = await api.requestTelegramOtp(tenantId, telegramPhone.trim());
                                                        if (res.status === 'otp_sent') {
                                                            setTelegramPhoneHash(res.phone_code_hash);
                                                            setTelegramStep('otp');
                                                        }
                                                    } catch (e: any) {
                                                        setToast({ message: `❌ Failed to send OTP: ${e.message}`, type: 'error' });
                                                    } finally {
                                                        setConnecting(false);
                                                    }
                                                }}
                                                disabled={connecting || !telegramPhone.trim()}
                                                style={{ flex: 2, padding: '14px', background: '#0088cc', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 14, cursor: connecting || !telegramPhone.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: connecting || !telegramPhone.trim() ? 0.7 : 1 }}
                                            >
                                                {connecting ? <Loader2 size={16} className="animate-spin" /> : 'Send Code'}
                                            </button>
                                        </div>
                                    </>
                                )}

                                {telegramStep === 'otp' && (
                                    <>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                                            We sent a code to your Telegram app on <strong>{telegramPhone}</strong>. Enter it below.
                                        </p>
                                        <div style={{ textAlign: 'left', marginBottom: 24 }}>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Login Code</label>
                                            <input
                                                type="text"
                                                value={telegramOtp}
                                                onChange={(e) => setTelegramOtp(e.target.value)}
                                                placeholder="12345"
                                                style={{
                                                    width: '100%', padding: '12px 16px', borderRadius: 12,
                                                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                                    color: 'var(--text-primary)', outline: 'none',
                                                    fontSize: 24, fontFamily: 'monospace', letterSpacing: '8px', textAlign: 'center'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button
                                                onClick={() => setTelegramStep('phone')}
                                                disabled={connecting}
                                                style={{ flex: 1, padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                                            >Back</button>
                                            <button
                                                onClick={async () => {
                                                    if (!telegramOtp.trim()) return;
                                                    setConnecting(true);
                                                    try {
                                                        const api = await import('@/lib/api');
                                                        const res = await api.verifyTelegramOtp(tenantId, telegramPhone.trim(), telegramOtp.trim(), telegramPhoneHash);
                                                        if (res.status === '2fa_required') {
                                                            setTelegramStep('2fa');
                                                        } else if (res.status === 'connected') {
                                                            setToast({ message: '✅ Phone connected successfully!', type: 'success' });
                                                            setConnectModal(null);
                                                            loadStatus();
                                                        } else {
                                                            setToast({ message: `❌ Error: ${res.detail}`, type: 'error' });
                                                        }
                                                    } catch (e: any) {
                                                        setToast({ message: `❌ Verification failed: ${e.message}`, type: 'error' });
                                                    } finally {
                                                        setConnecting(false);
                                                    }
                                                }}
                                                disabled={connecting || telegramOtp.length < 4}
                                                style={{ flex: 2, padding: '14px', background: '#0088cc', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 14, cursor: connecting || telegramOtp.length < 4 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: connecting || telegramOtp.length < 4 ? 0.7 : 1 }}
                                            >
                                                {connecting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Verify
                                            </button>
                                        </div>
                                    </>
                                )}

                                {telegramStep === '2fa' && (
                                    <>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                                            This account is protected with Two-Step Verification. Enter your password.
                                        </p>
                                        <div style={{ textAlign: 'left', marginBottom: 24 }}>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Password</label>
                                            <input
                                                type="password"
                                                value={telegramPassword}
                                                onChange={(e) => setTelegramPassword(e.target.value)}
                                                placeholder="••••••••"
                                                style={{
                                                    width: '100%', padding: '12px 16px', borderRadius: 12,
                                                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                                    color: 'var(--text-primary)', outline: 'none',
                                                    fontSize: 14
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button
                                                onClick={() => setTelegramStep('otp')}
                                                disabled={connecting}
                                                style={{ flex: 1, padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                                            >Back</button>
                                            <button
                                                onClick={async () => {
                                                    if (!telegramPassword.trim()) return;
                                                    setConnecting(true);
                                                    try {
                                                        const api = await import('@/lib/api');
                                                        const res = await api.verifyTelegramOtp(tenantId, telegramPhone.trim(), telegramOtp.trim(), telegramPhoneHash, telegramPassword);
                                                        if (res.status === 'connected') {
                                                            setToast({ message: '✅ Password accepted! Connected.', type: 'success' });
                                                            setConnectModal(null);
                                                            loadStatus();
                                                        } else {
                                                            setToast({ message: `❌ Error: ${res.detail}`, type: 'error' });
                                                        }
                                                    } catch (e: any) {
                                                        setToast({ message: `❌ Password incorrect: ${e.message}`, type: 'error' });
                                                    } finally {
                                                        setConnecting(false);
                                                    }
                                                }}
                                                disabled={connecting || !telegramPassword.trim()}
                                                style={{ flex: 2, padding: '14px', background: '#0088cc', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 14, cursor: connecting || !telegramPassword.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: connecting || !telegramPassword.trim() ? 0.7 : 1 }}
                                            >
                                                {connecting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Login
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Settings Modal (Connected Account Details) ─────── */}
            {settingsModal && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => { if (e.target === e.currentTarget) { setSettingsModal(null); setHealthResult(null); } }}
                >
                    <div className="animate-in" style={{
                        width: 540, maxHeight: '85vh', overflowY: 'auto',
                        background: 'var(--bg-main)', borderRadius: 24,
                        border: '1px solid var(--border)', padding: '40px',
                        boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 900 }}>
                                {settingsModal === 'instagram' ? 'Instagram' : 'Facebook'} Settings
                            </h2>
                            <button
                                onClick={() => { setSettingsModal(null); setHealthResult(null); }}
                                style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: '50%', width: 36, height: 36,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'var(--text-muted)',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Connected Accounts */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                                Connected Accounts
                            </div>
                            {getConnectedAccounts(settingsModal).map((acc, i) => (
                                <div key={i} style={{
                                    background: 'var(--bg-card)', borderRadius: 12,
                                    padding: '16px 20px', border: '1px solid var(--border)',
                                    marginBottom: 8,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 700 }}>
                                                {settingsModal === 'instagram'
                                                    ? `@${acc.username || 'Unknown'}`
                                                    : acc.page_name || 'Facebook Page'
                                                }
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                                ID: {settingsModal === 'instagram' ? acc.instagram_user_id : acc.page_id}
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '4px 10px', borderRadius: 8,
                                            background: acc.connection_status === 'connected'
                                                ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: acc.connection_status === 'connected' ? '#22c55e' : '#ef4444',
                                            fontSize: 12, fontWeight: 700,
                                        }}>
                                            <Wifi size={12} />
                                            {acc.connection_status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Connection Details */}
                        <div style={{
                            background: 'var(--bg-card)', borderRadius: 12, padding: '20px',
                            border: '1px solid var(--border)', marginBottom: 24,
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16 }}>
                                Connection Details
                            </div>
                            {[
                                {
                                    label: 'Connected Since',
                                    value: getConnectedAccounts(settingsModal)[0]?.created_at
                                        ? new Date(getConnectedAccounts(settingsModal)[0].created_at!).toLocaleDateString()
                                        : 'N/A'
                                },
                                {
                                    label: 'Token Expires',
                                    value: getConnectedAccounts(settingsModal)[0]?.token_expires_at
                                        ? new Date(getConnectedAccounts(settingsModal)[0].token_expires_at!).toLocaleDateString()
                                        : 'Never'
                                },
                                {
                                    label: 'Last Webhook',
                                    value: metaStatus?.last_event_at
                                        ? new Date(metaStatus.last_event_at).toLocaleString()
                                        : 'No events yet'
                                },
                            ].map((detail, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: '8px 0',
                                    borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                                    fontSize: 13,
                                }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{detail.label}</span>
                                    <span style={{ fontWeight: 700 }}>{detail.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Permissions */}
                        {getConnectedAccounts(settingsModal)[0]?.granted_scopes && (
                            <div style={{
                                background: 'var(--bg-card)', borderRadius: 12, padding: '20px',
                                border: '1px solid var(--border)', marginBottom: 24,
                            }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                                    Granted Permissions
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {getConnectedAccounts(settingsModal)[0].granted_scopes!.map((scope, i) => (
                                        <span key={i} style={{
                                            padding: '4px 10px', borderRadius: 6,
                                            background: 'rgba(99,102,241,0.1)',
                                            color: 'var(--accent)', fontSize: 11, fontWeight: 700,
                                        }}>
                                            {scope.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Health Check */}
                        <div style={{
                            background: 'var(--bg-card)', borderRadius: 12, padding: '20px',
                            border: '1px solid var(--border)', marginBottom: 32,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Webhook Health
                                </div>
                                <button
                                    onClick={handleHealthCheck}
                                    disabled={healthLoading}
                                    style={{
                                        padding: '6px 14px', borderRadius: 8,
                                        background: 'var(--accent)', border: 'none',
                                        color: '#fff', fontSize: 12, fontWeight: 700,
                                        cursor: healthLoading ? 'wait' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        opacity: healthLoading ? 0.7 : 1,
                                    }}
                                >
                                    {healthLoading ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
                                    Test
                                </button>
                            </div>
                            {healthResult && (
                                <div style={{ marginTop: 8 }}>
                                    {Object.entries(healthResult).map(([key, val]) => {
                                        const v = val as any;
                                        if (!v) return null;
                                        const isOk = v.status === 'ok';
                                        return (
                                            <div key={key} style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                padding: '8px 12px', borderRadius: 8,
                                                background: isOk ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                                marginBottom: 4, fontSize: 13,
                                            }}>
                                                {isOk ? <CheckCircle size={14} color="#22c55e" /> : <AlertCircle size={14} color="#ef4444" />}
                                                <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{key}</span>
                                                <span style={{ color: isOk ? '#22c55e' : '#ef4444', marginLeft: 'auto', fontWeight: 600 }}>
                                                    {isOk ? (v.page || v.username || 'OK') : (v.message || 'Error')}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Disconnect */}
                        <button
                            onClick={() => handleDisconnect(settingsModal)}
                            disabled={disconnecting}
                            style={{
                                width: '100%', padding: '14px',
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 12,
                                color: '#ef4444', fontWeight: 700, fontSize: 14,
                                cursor: disconnecting ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            {disconnecting ? <Loader2 size={16} className="animate-spin" /> : <Unplug size={16} />}
                            {disconnecting ? 'Disconnecting...' : `Disconnect ${settingsModal === 'instagram' ? 'Instagram' : 'Facebook'}`}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Coming Soon Detail Modal ────────────── */}
            {activeIntegration && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => { if (e.target === e.currentTarget) setActiveIntegration(null); }}
                >
                    <div className="animate-in" style={{
                        width: 'calc(100vw - 120px)', maxWidth: 960, height: '75vh',
                        background: 'var(--bg-main)', borderRadius: 24,
                        border: '1px solid var(--border)', display: 'flex',
                        overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
                    }}>
                        {/* Left Side */}
                        <div style={{ width: 340, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', padding: '48px 32px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                                width: 140, height: 140, background: activeIntegData.color, borderRadius: 24,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#fff',
                                marginBottom: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
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
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            }} disabled>
                                Not Available Yet
                            </button>
                        </div>

                        {/* Right Side */}
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
                                        { title: 'Rich Media Support', desc: 'Sync images, voice messages, and files directly to lead cards.' },
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
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function IntegrationsPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
        }>
            <IntegrationsPageContent />
        </Suspense>
    );
}
