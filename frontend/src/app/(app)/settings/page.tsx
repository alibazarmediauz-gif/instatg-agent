'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/TenantContext';
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

            <div style={{ display: 'flex', gap: 24 }}>
                {/* Tabs */}
                <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                                style={{ border: 'none', background: activeTab === tab.id ? 'var(--accent-glow)' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>

                    {/* ─── General ───────────────────────────────────── */}
                    {activeTab === 'general' && (
                        <div className="card">
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>General Settings</h3>
                            {saveMsg && <div style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: saveMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>{saveMsg}</div>}
                            <div className="input-group">
                                <label>Business Name</label>
                                <input className="input" value={tenant.name} onChange={e => setTenant(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div className="input-group">
                                <label>Owner Email</label>
                                <input className="input" type="email" value={tenant.owner_email} readOnly style={{ opacity: 0.7 }} />
                            </div>
                            <div className="input-group">
                                <label>Timezone</label>
                                <select className="input" value={tenant.timezone} onChange={e => setTenant(p => ({ ...p, timezone: e.target.value }))}>
                                    <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                                    <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                                    <option value="America/New_York">America/New_York (UTC-5)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Report Delivery to Telegram Chat ID</label>
                                <input className="input" value={tenant.owner_telegram_chat_id} onChange={e => setTenant(p => ({ ...p, owner_telegram_chat_id: e.target.value }))} placeholder="Enter your Telegram Chat ID" />
                            </div>
                            <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving} style={{ marginTop: 8 }}><Save size={16} />{saving ? 'Saving...' : 'Save Settings'}</button>
                        </div>
                    )}

                    {/* ─── Telegram (OTP Onboarding) ─────────────────── */}
                    {activeTab === 'telegram' && (
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Send size={22} color="var(--info)" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Dedicated Telegram Business Account</h3>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                        One phone number per business — receives and handles all incoming DMs
                                    </p>
                                </div>
                            </div>

                            {/* ── Connected State ── */}
                            {tg.status === 'connected' && (
                                <div>
                                    <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid rgba(34,197,94,0.3)', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px rgba(34,197,94,0.5)', animation: 'pulse-glow 2s infinite' }} />
                                                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--success)' }}>Connected 🟢</span>
                                            </div>
                                            {tg.isPremium && (
                                                <span style={{ padding: '4px 10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, fontSize: 12, fontWeight: 700, color: 'white' }}>
                                                    ⭐ Premium
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div style={{ padding: 14, background: 'var(--bg-card)', borderRadius: 10 }}>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>PHONE NUMBER</div>
                                                <div style={{ fontWeight: 600, fontSize: 15 }}>{tg.phoneNumber || '+998 90 123 4567'}</div>
                                            </div>
                                            <div style={{ padding: 14, background: 'var(--bg-card)', borderRadius: 10 }}>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ACCOUNT NAME</div>
                                                <div style={{ fontWeight: 600, fontSize: 15 }}>{tg.displayName}</div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-card)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                            ✅ Userbot is actively listening for incoming DMs<br />
                                            ✅ Session string encrypted and stored securely<br />
                                            {tg.isPremium && <>✅ Telegram Premium features enabled (faster limits, larger uploads)<br /></>}
                                        </div>
                                    </div>

                                    <button className="btn btn-danger" onClick={handleDisconnect} style={{ width: '100%', justifyContent: 'center' }}>
                                        <XCircle size={16} />
                                        Disconnect Account
                                    </button>
                                </div>
                            )}

                            {/* ── Disconnected / Enter Phone ── */}
                            {(tg.status === 'disconnected' || tg.status === 'entering_phone') && (
                                <div>
                                    <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                            <Smartphone size={18} color="var(--accent)" />
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>Step 1: Enter Business Phone Number</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                                            Enter the dedicated phone number bought for business use.
                                            An OTP code will be sent via Telegram to this number.
                                        </p>
                                        <input
                                            className="input"
                                            placeholder="+998 90 123 4567"
                                            value={tg.phoneNumber}
                                            onChange={(e) => setTg(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                            style={{ marginBottom: 12, fontSize: 16, fontWeight: 600, letterSpacing: 1 }}
                                        />
                                        <button className="btn btn-primary" onClick={handleSendOTP} style={{ width: '100%', justifyContent: 'center' }}>
                                            <Send size={16} />
                                            Send OTP Code
                                        </button>
                                    </div>

                                    {/* Info Box */}
                                    <div style={{ padding: 16, background: 'rgba(99,102,241,0.08)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>ℹ️ How it works</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                            1. Enter your dedicated business phone number<br />
                                            2. System sends OTP via Telegram<br />
                                            3. Enter OTP code here<br />
                                            4. Session is created, encrypted, and saved<br />
                                            5. Userbot starts listening for incoming DMs<br />
                                            6. Status shows "Connected 🟢"
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── OTP Sending ── */}
                            {tg.status === 'otp_sent' && (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <Loader2 size={40} color="var(--accent)" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                                    <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Sending OTP Code...</p>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sending verification code to {tg.phoneNumber}</p>
                                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                                </div>
                            )}

                            {/* ── Enter OTP ── */}
                            {tg.status === 'entering_otp' && (
                                <div>
                                    <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                            <KeyRound size={18} color="var(--success)" />
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>Step 2: Enter OTP Code</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                            Enter the OTP code sent to <strong>{tg.phoneNumber}</strong> via Telegram.
                                        </p>
                                        <input
                                            className="input"
                                            placeholder="12345"
                                            value={tg.otpCode}
                                            onChange={(e) => setTg(prev => ({ ...prev, otpCode: e.target.value }))}
                                            maxLength={6}
                                            style={{ marginBottom: 12, fontSize: 28, fontWeight: 800, textAlign: 'center', letterSpacing: 12 }}
                                        />
                                        <button className="btn btn-primary" onClick={handleVerifyOTP} style={{ width: '100%', justifyContent: 'center' }}>
                                            <CheckCircle size={16} />
                                            Verify & Connect
                                        </button>
                                    </div>
                                    <button className="btn btn-secondary" onClick={() => setTg(prev => ({ ...prev, status: 'disconnected', otpCode: '' }))} style={{ width: '100%', justifyContent: 'center' }}>
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {/* ── Verifying ── */}
                            {tg.status === 'verifying' && (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <Loader2 size={40} color="var(--success)" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                                    <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Verifying & Creating Session...</p>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Encrypting session string and starting userbot</p>
                                </div>
                            )}

                            {/* ── Error State ── */}
                            {tg.status === 'error' && (
                                <div style={{ padding: 20, background: 'rgba(239,68,68,0.08)', borderRadius: 14, border: '1px solid rgba(239,68,68,0.3)' }}>
                                    <p style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>❌ Connection Failed</p>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{tg.errorMessage || 'Unknown error occurred'}</p>
                                    <button className="btn btn-primary" onClick={() => setTg(prev => ({ ...prev, status: 'disconnected', errorMessage: '' }))}>
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Instagram ─────────────────────────────────── */}
                    {activeTab === 'instagram' && (
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Instagram Business Accounts</h3>
                                <button className="btn btn-primary" onClick={() => document.getElementById('ig-add')?.scrollIntoView({ behavior: 'smooth' })}><Instagram size={16} />Connect Account</button>
                            </div>

                            {igAccounts.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No accounts connected yet.</p>
                            ) : (
                                igAccounts.map(acc => (
                                    <div key={acc.id} style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Instagram size={18} color="#f472b6" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>@{acc.username || acc.instagram_user_id}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Business Account • {acc.is_active ? 'Active' : 'Inactive'}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            {acc.is_active ? <span className="badge positive">Connected</span> : <span className="badge warning">Disconnected</span>}
                                            <button className="btn btn-sm" style={{ background: 'var(--danger)', color: 'white', padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer' }} onClick={() => handleRemoveIg(acc.id)}>Remove</button>
                                        </div>
                                    </div>
                                ))
                            )}

                            <div id="ig-add" className="input-group" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                                <label style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'block' }}>Connect via Meta Graph API</label>
                                <input className="input" placeholder="Instagram User ID" style={{ marginBottom: 8 }} value={igForm.instagram_user_id} onChange={e => setIgForm(p => ({ ...p, instagram_user_id: e.target.value }))} />
                                <input className="input" placeholder="Page ID" style={{ marginBottom: 8 }} value={igForm.page_id} onChange={e => setIgForm(p => ({ ...p, page_id: e.target.value }))} />
                                <input className="input" placeholder="Access Token" type="password" style={{ marginBottom: 8 }} value={igForm.access_token} onChange={e => setIgForm(p => ({ ...p, access_token: e.target.value }))} />
                                <input className="input" placeholder="Display Username (@...)" value={igForm.username} onChange={e => setIgForm(p => ({ ...p, username: e.target.value }))} />
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleAddIg} disabled={addingIg}>{addingIg ? 'Connecting...' : 'Connect Account'}</button>
                        </div>
                    )}

                    {/* ─── Facebook ──────────────────────────────────── */}
                    {activeTab === 'facebook' && (
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Facebook size={22} color="var(--info)" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Facebook Business Pages</h3>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                        Connect Facebook Pages to reply to Messenger and Comments
                                    </p>
                                </div>
                            </div>

                            {fbStatus.connected ? (
                                <div>
                                    <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid rgba(34,197,94,0.3)', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px rgba(34,197,94,0.5)', animation: 'pulse-glow 2s infinite' }} />
                                            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--success)' }}>Connected 🟢</span>
                                        </div>
                                        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-card)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                                            ✅ Webhooks active for messaging<br />
                                            ✅ Pages loaded: {fbStatus.accounts.map((a: any) => a.name).join(', ')}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                            window.location.href = `${API_URL}/api/facebook-auth/login?tenant_id=${tenantId}`;
                                        }}
                                        style={{ width: '100%', justifyContent: 'center', background: '#e2e8f0', color: '#0f172a' }}
                                    >
                                        <Link2 size={16} /> Re-Connect Pages
                                    </button>
                                </div>
                            ) : (
                                <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 20 }}>
                                    <div style={{ padding: 40, textAlign: 'center' }}>
                                        <Facebook size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Connect with Facebook</p>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                                            Link your Facebook Business Pages to automate Messenger replies and comments using the official Meta API.
                                        </p>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                                window.location.href = `${API_URL}/api/facebook-auth/login?tenant_id=${tenantId}`;
                                            }}
                                            style={{ margin: '0 auto' }}
                                        >
                                            <Facebook size={16} /> Connect with Facebook
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── AI Persona ────────────────────────────────── */}
                    {activeTab === 'ai' && (
                        <div className="card">
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>AI Persona Configuration</h3>
                            {saveMsg && <div style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: saveMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>{saveMsg}</div>}
                            <div className="input-group">
                                <label>Custom Persona Instructions</label>
                                <textarea
                                    className="input"
                                    style={{ minHeight: 200 }}
                                    value={tenant.ai_persona}
                                    onChange={(e) => setTenant(p => ({ ...p, ai_persona: e.target.value }))}
                                />
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleSaveSettings} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save Persona'}</button>
                        </div>
                    )}

                    {/* ─── Human Handoff ─────────────────────────────── */}
                    {activeTab === 'handoff' && (
                        <div className="card">
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Human Handoff Rules</h3>
                            {saveMsg && <div style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: saveMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>{saveMsg}</div>}
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" checked={tenant.human_handoff_enabled} onChange={(e) => setTenant(p => ({ ...p, human_handoff_enabled: e.target.checked }))} /> Enable human handoff
                                </label>
                            </div>
                            <div className="input-group">
                                <label>Trigger handoff when:</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                    {['AI confidence drops below 30%', 'Customer explicitly requests human', 'Negative sentiment detected 3+ times', 'Customer mentions legal/complaint'].map((rule, i) => (
                                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                                            <input type="checkbox" defaultChecked={i < 3} disabled={!tenant.human_handoff_enabled} /> {rule}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Notification Telegram Chat ID</label>
                                <input className="input" placeholder="Chat ID to notify when handoff triggers" value={tenant.owner_telegram_chat_id} onChange={(e) => setTenant(p => ({ ...p, owner_telegram_chat_id: e.target.value }))} disabled={!tenant.human_handoff_enabled} />
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleSaveSettings} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save Rules'}</button>
                        </div>
                    )}

                    {/* ─── Subscription & Billing ─────────────────────── */}
                    {activeTab === 'billing' && (
                        <div className="animate-in">
                            <div className="card" style={{ marginBottom: 24 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Current Subscription</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>Pro Plan</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Billed monthly in UZS</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 18, fontWeight: 700 }}>1,500,000 UZS</div>
                                        <div style={{ fontSize: 12, color: 'var(--success)' }}>Active until Mar 26, 2026</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                                <div className="card">
                                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>AI Call Usage</h4>
                                    <div style={{ height: 10, background: 'var(--bg-card)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                                        <div style={{ height: '100%', width: '28.4%', background: 'var(--accent)' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                        <span>142 / 500 calls</span>
                                        <span style={{ color: 'var(--text-muted)' }}>28% used</span>
                                    </div>
                                </div>
                                <div className="card">
                                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>AI Chat Usage</h4>
                                    <div style={{ height: 10, background: 'var(--bg-card)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                                        <div style={{ height: '100%', width: '56.8%', background: '#8b5cf6' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                        <span>2,840 / 5,000 chats</span>
                                        <span style={{ color: 'var(--text-muted)' }}>56% used</span>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Top-up Wallet (Uzbekistan Local)</h3>
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <button className="btn" style={{ flex: 1, height: 60, background: '#19b4ff', color: 'white', fontSize: 16, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                        <span style={{ opacity: 0.9 }}>Pay with</span> Payme
                                    </button>
                                    <button className="btn" style={{ flex: 1, height: 60, background: '#0055ff', color: 'white', fontSize: 16, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                        <span style={{ opacity: 0.9 }}>Pay with</span> CLICK
                                    </button>
                                </div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
                                    Payments are processed instantly in UZS. For USD/Stripe, contact support.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
