'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useCurrency } from '@/lib/CurrencyContext';
import { getTenantSettings, updateTenantSettings, getTelegramAccount, sendTelegramOTP, verifyTelegramOTP, disconnectTelegram, getInstagramAccounts, addInstagramAccount, deleteInstagramAccount } from '@/lib/api';
import { Settings as SettingsIcon, Send, Instagram, Bot, Shield, Save, Loader2, CheckCircle, XCircle, Smartphone, KeyRound, Facebook, Link2, DollarSign } from 'lucide-react';

type TelegramStatus = 'disconnected' | 'entering_phone' | 'otp_sent' | 'entering_otp' | 'verifying' | 'connected' | 'error';

interface TelegramState {
    status: TelegramStatus;
    phoneNumber: string;
    displayName: string;
    isPremium: boolean;
    otpCode: string;
    phoneCodeHash: string;
    errorMessage: string;
}

interface TenantData {
    name: string;
    owner_email: string;
    timezone: string;
    ai_persona: string;
    human_handoff_enabled: boolean;
    owner_telegram_chat_id: string;
}

export default function SettingsPage() {
    const { tenantId } = useTenant();
    const [activeTab, setActiveTab] = useState('general');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    const { locale, setLocale, t } = useLanguage();
    const { currency, setCurrency } = useCurrency();

    // Tenant settings from API
    const [tenant, setTenant] = useState<TenantData>({
        name: '', owner_email: '', timezone: 'Asia/Tashkent',
        ai_persona: '', human_handoff_enabled: true, owner_telegram_chat_id: '',
    });

    // Telegram OTP onboarding state
    const [tg, setTg] = useState<TelegramState>({
        status: 'disconnected', phoneNumber: '', displayName: '',
        isPremium: false, otpCode: '', phoneCodeHash: '', errorMessage: '',
    });

    // Facebook Auth Stats
    const [fbStatus, setFbStatus] = useState({ connected: false, accounts: [] as { id: string, name: string }[] });

    // Instagram Accounts
    const [igAccounts, setIgAccounts] = useState<any[]>([]);
    const [igForm, setIgForm] = useState({ instagram_user_id: '', page_id: '', access_token: '', username: '' });
    const [addingIg, setAddingIg] = useState(false);

    const loadIgAccounts = async () => {
        try {
            const res = await getInstagramAccounts(tenantId) as any;
            if (res.accounts) setIgAccounts(res.accounts);
        } catch (e) { console.error('Instagram load error:', e); }
    };

    // Load real data on mount
    useEffect(() => {
        async function load() {
            try {
                const t = await getTenantSettings(tenantId) as any;
                setTenant({
                    name: t.name || '', owner_email: t.owner_email || '',
                    timezone: t.timezone || 'Asia/Tashkent', ai_persona: t.ai_persona || '',
                    human_handoff_enabled: t.human_handoff_enabled ?? true,
                    owner_telegram_chat_id: t.owner_telegram_chat_id || '',
                });
            } catch (e) { console.error('Tenant load error:', e); }

            try {
                const tgAcc = await getTelegramAccount(tenantId) as any;
                if (tgAcc.connected) {
                    setTg(prev => ({
                        ...prev, status: 'connected',
                        phoneNumber: tgAcc.phone_number || '',
                        displayName: tgAcc.display_name || '',
                        isPremium: tgAcc.is_premium || false,
                    }));
                }
            } catch (e) { console.error('Telegram load error:', e); }

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const fbRes = await fetch(`${API_URL}/api/facebook-auth/status?tenant_id=${tenantId}`);
                if (fbRes.ok) {
                    setFbStatus(await fbRes.json());
                }
            } catch (e) { console.error('Facebook status error:', e); }

            await loadIgAccounts();
        }
        load();
    }, [tenantId]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('fb_connected') === 'true') {
                setActiveTab('facebook');
            }
        }
    }, []);

    const tabs = [
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'telegram', label: 'Telegram', icon: Send },
        { id: 'instagram', label: 'Instagram', icon: Instagram },
        { id: 'facebook', label: 'Facebook', icon: Facebook },
        { id: 'ai', label: 'AI Persona', icon: Bot },
        { id: 'handoff', label: 'Human Handoff', icon: Shield },
        { id: 'billing', label: 'Subscription & Billing', icon: DollarSign },
    ];

    // ─── Telegram Demo Handlers ─────────────────────────────────────

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            await updateTenantSettings(tenantId, tenant as any);
            setSaveMsg('✅ Settings saved!');
            setTimeout(() => setSaveMsg(''), 3000);
        } catch (e: any) {
            setSaveMsg('❌ ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSendOTP = async () => {
        if (!tg.phoneNumber || tg.phoneNumber.length < 10) return;
        setTg(prev => ({ ...prev, status: 'otp_sent', errorMessage: '' }));

        try {
            const res = await sendTelegramOTP(tenantId, tg.phoneNumber) as any;
            setTg(prev => ({ ...prev, status: 'entering_otp', phoneCodeHash: res.phone_code_hash }));
        } catch (e: any) {
            setTg(prev => ({ ...prev, status: 'error', errorMessage: e.message || 'Failed to send OTP' }));
        }
    };

    const handleVerifyOTP = async () => {
        if (!tg.otpCode || tg.otpCode.length < 4) return;
        setTg(prev => ({ ...prev, status: 'verifying' }));

        try {
            const res = await verifyTelegramOTP(tenantId, tg.phoneNumber, tg.otpCode, tg.phoneCodeHash) as any;
            setTg(prev => ({ ...prev, status: 'connected', displayName: res.display_name || 'Business Account', isPremium: res.is_premium || false }));
        } catch (e: any) {
            setTg(prev => ({ ...prev, status: 'error', errorMessage: e.message || 'Failed to verify OTP' }));
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnectTelegram(tenantId);
            setTg({ status: 'disconnected', phoneNumber: '', displayName: '', isPremium: false, otpCode: '', phoneCodeHash: '', errorMessage: '' });
        } catch (e: any) {
            setTg(prev => ({ ...prev, status: 'error', errorMessage: e.message || 'Failed to disconnect account' }));
        }
    };

    const handleAddIg = async () => {
        if (!igForm.instagram_user_id || !igForm.access_token || !igForm.page_id) return;
        setAddingIg(true);
        try {
            await addInstagramAccount(tenantId, igForm);
            setIgForm({ instagram_user_id: '', page_id: '', access_token: '', username: '' });
            await loadIgAccounts();
        } catch (e: any) {
            alert('Failed to add IG account: ' + e.message);
        } finally {
            setAddingIg(false);
        }
    };

    const handleRemoveIg = async (id: string) => {
        if (!confirm('Remove this Instagram account?')) return;
        try {
            await deleteInstagramAccount(tenantId, id);
            await loadIgAccounts();
        } catch (e: any) {
            alert('Failed to remove IG account: ' + e.message);
        }
    };

    // ─── Render ─────────────────────────────────────────────────────

    return (
        <div className="page-container animate-in">

            <div style={{ display: 'flex', gap: 32, maxWidth: 1080, margin: '0 auto', width: '100%' }}>
                {/* Tabs Sidebar */}
                <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', marginBottom: 8 }}>
                        Settings
                    </div>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 14px', borderRadius: 8,
                                    border: 'none', cursor: 'pointer', textAlign: 'left',
                                    fontFamily: 'inherit', fontSize: 14, fontWeight: isActive ? 600 : 500,
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                                    transition: 'all 0.2s',
                                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.05)' : 'none'
                                }}
                            >
                                <Icon size={18} color={isActive ? 'var(--accent)' : 'currentColor'} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>

                    {/* ─── General ───────────────────────────────────── */}
                    {activeTab === 'general' && (
                        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>General Settings</h2>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>Manage your business profile, language preferences, and basic configurations.</p>
                            </div>

                            {saveMsg && <div style={{ padding: '12px 16px', borderRadius: 8, fontSize: 14, border: `1px solid ${saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, background: saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: saveMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>{saveMsg}</div>}

                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 300px) 1fr', gap: 32 }}>
                                        <div>
                                            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Business Profile</h3>
                                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>The name and contact information associated with this tenant.</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Business Name</label>
                                                <input className="input" value={tenant.name} onChange={e => setTenant(p => ({ ...p, name: e.target.value }))} style={{ maxWidth: 400 }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Owner Email</label>
                                                <input className="input" type="email" value={tenant.owner_email} readOnly style={{ maxWidth: 400, opacity: 0.6, cursor: 'not-allowed', background: 'var(--bg-body)' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 300px) 1fr', gap: 32 }}>
                                        <div>
                                            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Localization</h3>
                                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Set your preferred language, currency, and timezone.</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Platform Language</label>
                                                <select className="input" value={locale} onChange={e => setLocale(e.target.value as any)} style={{ maxWidth: 400 }}>
                                                    <option value="uz">O'zbekcha (UZ)</option>
                                                    <option value="ru">Русский (RU)</option>
                                                    <option value="en">English (EN)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Platform Currency</label>
                                                <select className="input" value={currency} onChange={e => setCurrency(e.target.value as any)} style={{ maxWidth: 400 }}>
                                                    <option value="USD">USD ($)</option>
                                                    <option value="UZS">UZS (So'm)</option>
                                                    <option value="RUB">RUB (₽)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="KZT">KZT (₸)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Timezone</label>
                                                <select className="input" value={tenant.timezone} onChange={e => setTenant(p => ({ ...p, timezone: e.target.value }))} style={{ maxWidth: 400 }}>
                                                    <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                                                    <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                                                    <option value="America/New_York">America/New_York (UTC-5)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 300px) 1fr', gap: 32 }}>
                                        <div>
                                            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Notifications</h3>
                                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Configure where critical alerts are sent.</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Telegram Chat ID</label>
                                                <input className="input" value={tenant.owner_telegram_chat_id} onChange={e => setTenant(p => ({ ...p, owner_telegram_chat_id: e.target.value }))} placeholder="Enter your Telegram Chat ID" style={{ maxWidth: 400 }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving} style={{ padding: '8px 24px' }}>
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {saving ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Telegram (OTP Onboarding) ─────────────────── */}
                    {activeTab === 'telegram' && (
                        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Telegram Integration</h2>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>Connect a dedicated Telegram Business Account to manage incoming DMs automatically.</p>
                            </div>

                            <div className="card" style={{ padding: '32px 24px' }}>
                                {/* ── Connected State ── */}
                                {tg.status === 'connected' && (
                                    <div>
                                        <div style={{ padding: 24, background: 'linear-gradient(145deg, rgba(34,197,94,0.05), rgba(34,197,94,0.01))', borderRadius: 16, border: '1px solid rgba(34,197,94,0.2)', marginBottom: 24 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Send size={24} color="#3b82f6" />
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px rgba(34,197,94,0.5)', animation: 'pulse-glow 2s infinite' }} />
                                                            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Session</span>
                                                        </div>
                                                        <div style={{ fontSize: 18, fontWeight: 700 }}>{tg.displayName}</div>
                                                    </div>
                                                </div>
                                                {tg.isPremium && (
                                                    <span style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 10px rgba(139,92,246,0.3)' }}>
                                                        ⭐ Premium
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</div>
                                                    <div style={{ fontWeight: 600, fontSize: 16, fontFamily: 'monospace' }}>{tg.phoneNumber || '+998 90 123 4567'}</div>
                                                </div>
                                                <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capabilities</div>
                                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <span>✅ Userbot active</span>
                                                        <span>✅ E2E Encrypted</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="btn btn-danger" onClick={handleDisconnect} style={{ margin: '0 auto', display: 'flex' }}>
                                            <XCircle size={16} /> Disconnect Account
                                        </button>
                                    </div>
                                )}

                                {/* ── Disconnected / Enter Phone ── */}
                                {(tg.status === 'disconnected' || tg.status === 'entering_phone') && (
                                    <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
                                        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                            <Send size={32} color="#3b82f6" />
                                        </div>
                                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Connect Telegram Account</h3>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                                            Enter the dedicated phone number used for this business. We will send an OTP directly via the Telegram app.
                                        </p>

                                        <div style={{ textAlign: 'left', marginBottom: 24 }}>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Business Phone Number</label>
                                            <input
                                                className="input"
                                                placeholder="+998 90 123 4567"
                                                value={tg.phoneNumber}
                                                onChange={(e) => setTg(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                                style={{ fontSize: 18, fontWeight: 600, letterSpacing: 1, padding: '14px 16px', textAlign: 'center' }}
                                            />
                                        </div>

                                        <button className="btn btn-primary" onClick={handleSendOTP} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}>
                                            <Send size={18} /> Send OTP Code
                                        </button>
                                    </div>
                                )}

                                {/* ── OTP Sending ── */}
                                {tg.status === 'otp_sent' && (
                                    <div style={{ padding: 60, textAlign: 'center' }}>
                                        <Loader2 size={48} color="var(--accent)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
                                        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sending OTP Code...</p>
                                        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Delivering to {tg.phoneNumber} securely.</p>
                                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                                    </div>
                                )}

                                {/* ── Enter OTP ── */}
                                {tg.status === 'entering_otp' && (
                                    <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
                                        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                            <KeyRound size={32} color="var(--success)" />
                                        </div>
                                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Enter Verification Code</h3>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                                            Check your Telegram app at <strong>{tg.phoneNumber}</strong> for the code.
                                        </p>

                                        <input
                                            className="input"
                                            placeholder="1 2 3 4 5"
                                            value={tg.otpCode}
                                            onChange={(e) => setTg(prev => ({ ...prev, otpCode: e.target.value }))}
                                            maxLength={6}
                                            style={{ marginBottom: 24, fontSize: 32, fontWeight: 800, textAlign: 'center', letterSpacing: 16, padding: '16px' }}
                                        />

                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button className="btn btn-secondary" onClick={() => setTg(prev => ({ ...prev, status: 'disconnected', otpCode: '' }))} style={{ flex: 1, justifyContent: 'center' }}>
                                                Cancel
                                            </button>
                                            <button className="btn btn-primary" onClick={handleVerifyOTP} style={{ flex: 2, justifyContent: 'center' }}>
                                                <CheckCircle size={18} /> Verify
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── Verifying ── */}
                                {tg.status === 'verifying' && (
                                    <div style={{ padding: 60, textAlign: 'center' }}>
                                        <Loader2 size={48} color="var(--success)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
                                        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Connecting Userbot Session...</p>
                                        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Generating encrypted session strings.</p>
                                    </div>
                                )}

                                {/* ── Error State ── */}
                                {tg.status === 'error' && (
                                    <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
                                        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                            <XCircle size={32} color="var(--danger)" />
                                        </div>
                                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--danger)' }}>Connection Failed</h3>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                                            {tg.errorMessage || 'Unknown error occurred during connection.'}
                                        </p>
                                        <button className="btn btn-primary" onClick={() => setTg(prev => ({ ...prev, status: 'disconnected', errorMessage: '' }))} style={{ width: '100%', justifyContent: 'center' }}>
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── Instagram ─────────────────────────────────── */}
                    {activeTab === 'instagram' && (
                        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Instagram Integration</h2>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>Connect Instagram Business Accounts via the Meta Graph API.</p>
                                </div>
                                <button className="btn btn-primary" onClick={() => document.getElementById('ig-add')?.scrollIntoView({ behavior: 'smooth' })} style={{ borderRadius: 20, padding: '8px 16px' }}><Instagram size={16} />Connect Account</button>
                            </div>

                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '24px', minHeight: 160, display: 'flex', flexDirection: 'column' }}>
                                    {igAccounts.length === 0 ? (
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                                <Instagram size={32} color="#f472b6" />
                                            </div>
                                            <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-secondary)' }}>No Instagram Accounts Connected</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                                            {igAccounts.map(acc => (
                                                <div key={acc.id} style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                            <Instagram size={20} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: 15 }}>@{acc.username || acc.instagram_user_id}</div>
                                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                {acc.is_active ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>● Active</span> : <span style={{ color: 'var(--warning)', fontWeight: 600 }}>● Disconnected</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12, color: 'var(--danger)', borderColor: 'transparent', background: 'transparent' }} onClick={() => handleRemoveIg(acc.id)}>Revoke</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div id="ig-add" style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Developer API Connection</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Instagram User ID</label>
                                            <input className="input" placeholder="e.g. 178414..." value={igForm.instagram_user_id} onChange={e => setIgForm(p => ({ ...p, instagram_user_id: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Page ID</label>
                                            <input className="input" placeholder="e.g. 102938..." value={igForm.page_id} onChange={e => setIgForm(p => ({ ...p, page_id: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Long-Lived Access Token</label>
                                        <input className="input" placeholder="EAAI..." type="password" value={igForm.access_token} onChange={e => setIgForm(p => ({ ...p, access_token: e.target.value }))} />
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Display Username</label>
                                        <input className="input" placeholder="@yourbusiness" value={igForm.username} onChange={e => setIgForm(p => ({ ...p, username: e.target.value }))} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-primary" onClick={handleAddIg} disabled={addingIg}>
                                            {addingIg ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            {addingIg ? 'Connecting...' : 'Securely Connect Account'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Facebook ──────────────────────────────────── */}
                    {activeTab === 'facebook' && (
                        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Facebook Business</h2>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>Connect Facebook Pages to reply to Messenger and Comments automatically.</p>
                            </div>

                            <div className="card" style={{ padding: 0 }}>
                                {fbStatus.connected ? (
                                    <div style={{ padding: '32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
                                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Facebook size={24} color="#3b82f6" />
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px rgba(34,197,94,0.5)', animation: 'pulse-glow 2s infinite' }} />
                                                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pages Connected</span>
                                                </div>
                                                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Webhooks are active and receiving messages.</div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: 24 }}>
                                            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Linked Pages</h4>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                                {fbStatus.accounts.map((a: any, i) => (
                                                    <div key={i} style={{ padding: '10px 16px', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border)', fontSize: 14, fontWeight: 500 }}>
                                                        {a.name}
                                                    </div>
                                                ))}
                                                {fbStatus.accounts.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No pages found. Re-connect to sync.</span>}
                                            </div>
                                        </div>

                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                                window.location.href = `${API_URL}/api/facebook-auth/login?tenant_id=${tenantId}`;
                                            }}
                                            style={{ display: 'inline-flex' }}
                                        >
                                            <Link2 size={16} /> Update Connected Pages
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                                        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                            <Facebook size={32} color="#3b82f6" />
                                        </div>
                                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Connect with Facebook</h3>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5 }}>
                                            Link your Facebook Business Pages to automate Messenger replies and comments using the official Meta Direct API.
                                        </p>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                                window.location.href = `${API_URL}/api/facebook-auth/login?tenant_id=${tenantId}`;
                                            }}
                                            style={{ padding: '12px 24px', fontSize: 15 }}
                                        >
                                            <Facebook size={18} /> Continue with Facebook
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── AI Persona ────────────────────────────────── */}
                    {activeTab === 'ai' && (
                        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>AI Persona Rules</h2>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>Define how your bots communicate, their tone of voice, and custom instructions.</p>
                            </div>

                            {saveMsg && <div style={{ padding: '12px 16px', borderRadius: 8, fontSize: 14, border: `1px solid ${saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, background: saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: saveMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>{saveMsg}</div>}

                            <div className="card" style={{ padding: 0 }}>
                                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                                    <textarea
                                        className="input"
                                        style={{ minHeight: 300, fontFamily: 'monospace', fontSize: 14, lineHeight: 1.6 }}
                                        placeholder="You are a helpful sales agent for... Include rules on how to respond to objections."
                                        value={tenant.ai_persona}
                                        onChange={(e) => setTenant(p => ({ ...p, ai_persona: e.target.value }))}
                                    />
                                </div>
                                <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Changes apply immediately to all active conversations.</span>
                                    <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {saving ? 'Saving...' : 'Deploy System Prompt'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Human Handoff ─────────────────────────────── */}
                    {activeTab === 'handoff' && (
                        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Escalation & Handoff</h2>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>Configure logic for routing complex conversations from AI agents to human operators.</p>
                            </div>

                            {saveMsg && <div style={{ padding: '12px 16px', borderRadius: 8, fontSize: 14, border: `1px solid ${saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, background: saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: saveMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>{saveMsg}</div>}

                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: tenant.human_handoff_enabled ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Shield size={20} color={tenant.human_handoff_enabled ? 'var(--success)' : 'var(--text-muted)'} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 600 }}>Human Handoff Master Switch</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Enable or disable routing logic entirely.</div>
                                        </div>
                                    </div>
                                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                                        <input type="checkbox" checked={tenant.human_handoff_enabled} onChange={(e) => setTenant(p => ({ ...p, human_handoff_enabled: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
                                        <span className={`slider ${tenant.human_handoff_enabled ? 'checked' : ''}`} style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tenant.human_handoff_enabled ? 'var(--accent)' : 'var(--border)', transition: '.4s', borderRadius: 24 }} />
                                    </label>
                                </div>

                                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Escalation Triggers</h3>
                                    <div style={{ display: 'grid', gap: 12 }}>
                                        {['AI confidence drops below 30%', 'Customer explicitly requests human', 'Negative sentiment detected 3+ times', 'Customer mentions legal/complaint'].map((rule, i) => (
                                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, padding: '12px 16px', background: 'var(--bg-body)', borderRadius: 8, border: '1px solid var(--border)', opacity: tenant.human_handoff_enabled ? 1 : 0.5 }}>
                                                <input type="checkbox" defaultChecked={i < 3} disabled={!tenant.human_handoff_enabled} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                                                <span style={{ fontWeight: 500 }}>{rule}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Routing Destination</h3>
                                    <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>Where should we send alert notifications when a trigger is hit?</p>
                                    <input className="input" placeholder="Telegram Chat ID" value={tenant.owner_telegram_chat_id} onChange={(e) => setTenant(p => ({ ...p, owner_telegram_chat_id: e.target.value }))} disabled={!tenant.human_handoff_enabled} style={{ maxWidth: 400 }} />
                                </div>

                                <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving} style={{ padding: '8px 24px' }}>
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {saving ? 'Saving...' : 'Save Handoff Logic'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Subscription & Billing ─────────────────────── */}
                    {activeTab === 'billing' && (
                        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Subscription & Billing</h2>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>Manage your active plan, monitor API usage, and top-up your agent wallet.</p>
                            </div>

                            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--accent)', background: 'linear-gradient(145deg, var(--bg-card), rgba(37,99,235,0.05))' }}>
                                <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(37,99,235,0.1)' }}>
                                    <div>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--accent)', color: 'white', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                                            <CheckCircle size={12} /> Active Plan
                                        </div>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Pro Plan</div>
                                        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Advanced AI Agents & Unlimited CRM Sync</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>1,500,000 UZS <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>/ mo</span></div>
                                        <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>Next billing date: Mar 26, 2026</div>
                                    </div>
                                </div>
                                <div style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, background: 'rgba(255,255,255,0.01)' }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>AI Call Quota (Voice)</div>
                                        <div style={{ height: 8, background: 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 8, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
                                            <div style={{ height: '100%', width: '28.4%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: 4 }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500 }}>
                                            <span style={{ color: 'var(--text-primary)' }}>142 / 500 calls</span>
                                            <span style={{ color: 'var(--text-muted)' }}>28%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>AI Chat Quota (Tokens)</div>
                                        <div style={{ height: 8, background: 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 8, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
                                            <div style={{ height: '100%', width: '56.8%', background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: 4 }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500 }}>
                                            <span style={{ color: 'var(--text-primary)' }}>2,840 / 5,000 chats</span>
                                            <span style={{ color: 'var(--text-muted)' }}>56%</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '16px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                    <button className="btn btn-secondary">Manage Subscription</button>
                                </div>
                            </div>

                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>Top-up Agent Wallet</h3>
                                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Add funds for API overages and pay-as-you-go voice services.</p>
                                </div>
                                <div style={{ padding: '32px 24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                                        {/* Payme Button */}
                                        <button className="btn" style={{ height: 64, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 16, padding: '0 24px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#19b4ff'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                            <div style={{ width: 40, height: 40, background: '#19b4ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 11, letterSpacing: '0.05em' }}>
                                                P
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Pay with Payme</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Instant UZS Transfer</div>
                                            </div>
                                        </button>

                                        {/* CLICK Button */}
                                        <button className="btn" style={{ height: 64, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 16, padding: '0 24px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#0055ff'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                            <div style={{ width: 40, height: 40, background: '#0055ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 11, letterSpacing: '0.05em' }}>
                                                C
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Pay with CLICK</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bank Cards & USSD</div>
                                            </div>
                                        </button>

                                        {/* Stripe Button */}
                                        <button className="btn" style={{ height: 64, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 16, padding: '0 24px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                            <div style={{ width: 40, height: 40, background: '#6366f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                <DollarSign size={20} />
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Pay with Stripe</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>USD / Visa / Mastercard</div>
                                            </div>
                                        </button>
                                    </div>
                                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 8 }}>
                                        <Shield size={14} color="var(--success)" />
                                        <span>All payments are securely processed and encrypted. Funds are added to your wallet instantly.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
