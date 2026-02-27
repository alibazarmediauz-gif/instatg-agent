'use client';

import { useState } from 'react';
import {
    Users, Settings, Shield, Activity, Database, Key,
    Bell, Globe, Zap, ChevronRight, Plus, Edit2, Trash2,
    Check, AlertTriangle, Server, RefreshCw, Download,
    Copy, Eye, EyeOff, Lock, Cpu, CheckCircle2
} from 'lucide-react';
import { useTenant } from '@/lib/TenantContext';

// ── Admin Data ────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    Owner: { bg: 'rgba(101,62,255,0.12)', color: '#8b5cf6' },
    Admin: { bg: 'rgba(37,99,235,0.12)', color: '#3b82f6' },
    Manager: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    Viewer: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

const TABS = [
    { id: 'users', label: 'Team Members', icon: <Users size={15} /> },
    { id: 'security', label: 'Security', icon: <Shield size={15} /> },
    { id: 'api', label: 'API Keys', icon: <Key size={15} /> },
    { id: 'system', label: 'System', icon: <Server size={15} /> },
];

export default function AdminPage() {
    const { tenantId } = useTenant();
    const [tab, setTab] = useState('users');
    const [users, setUsers] = useState<any[]>([]);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [sessions, setSessions] = useState([
        { id: 's1', user: 'Nazir E.', device: 'MacBook Pro — Chrome 121', ip: '84.201.142.xx', location: 'Tashkent, UZ', current: true },
        { id: 's2', user: 'Amir K.', device: 'iPhone 15 — Safari', ip: '192.168.1.xx', location: 'Almaty, KZ', current: false },
    ]);
    const [showKey, setShowKey] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState('Manager');
    const [newKeyName, setNewKeyName] = useState('');

    const copyKey = (keyId: string, val: string) => {
        navigator.clipboard.writeText(val).catch(() => { });
        setCopied(keyId);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleInvite = () => {
        if (!newUserName || !newUserEmail) return;
        const newUser = {
            id: Date.now().toString(),
            name: newUserName,
            email: newUserEmail,
            role: newUserRole,
            status: 'active',
            last_seen: 'Just now',
            avatar: newUserName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        };
        setUsers([...users, newUser]);
        setShowInviteModal(false);
        setNewUserName('');
        setNewUserEmail('');
    };

    const handleDeleteUser = (id: string) => {
        setUsers(users.filter(u => u.id !== id));
    };

    const handleCreateKey = () => {
        if (!newKeyName) return;
        const newKey = {
            id: Date.now().toString(),
            name: newKeyName,
            key: `sk-live-${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
            created: new Date().toISOString().split('T')[0],
            last_used: 'Never',
            scopes: ['read', 'write']
        };
        setApiKeys([...apiKeys, newKey]);
        setShowKeyModal(false);
        setNewKeyName('');
    };

    const handleRevokeKey = (id: string) => {
        setApiKeys(apiKeys.filter(k => k.id !== id));
    };

    const handleRevokeSession = (id: string) => {
        setSessions(sessions.filter(s => s.id !== id));
    };

    return (
        <div className="page-container animate-in" style={{ padding: '28px 36px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Admin Panel</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Manage team, security, API keys, and system settings</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" style={{ gap: 8 }}><Download size={14} /> Export Logs</button>
                    <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => setShowInviteModal(true)}><Plus size={14} /> Invite Member</button>
                </div>
            </div>

            {/* KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                {[
                    { label: 'Team Members', value: `${users.length}`, sub: 'Active team members', color: 'var(--accent)', icon: <Users size={16} /> },
                    { label: 'API Keys', value: `${apiKeys.length}`, sub: 'All live', color: 'var(--success)', icon: <Key size={16} /> },
                    { label: '2FA Enabled', value: '3/4', sub: '75% coverage', color: 'var(--warning)', icon: <Lock size={16} /> },
                    { label: 'System Uptime', value: '99.98%', sub: 'Last 30 days', color: 'var(--success)', icon: <Activity size={16} /> },
                ].map(kpi => (
                    <div key={kpi.label} className="card" style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${kpi.color}15`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {kpi.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{kpi.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{kpi.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{kpi.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', padding: 6, borderRadius: 12, width: 'fit-content', border: '1px solid var(--border)' }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 8,
                        background: tab === t.id ? 'var(--accent)' : 'transparent',
                        color: tab === t.id ? '#fff' : 'var(--text-muted)',
                        border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                    }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Team Members ─────────────────────────────────────── */}
            {tab === 'users' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Team Members</h3>
                        <button className="btn btn-primary" style={{ gap: 6, height: 32, fontSize: 12 }}><Plus size={12} /> Invite</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border)' }}>
                                {['Member', 'Email', 'Role', 'Status', 'Last Seen', ''].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => {
                                const rc = ROLE_COLORS[user.role] || ROLE_COLORS.Viewer;
                                return (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '50%',
                                                    background: `linear-gradient(135deg, var(--accent), #8b5cf6)`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0
                                                }}>{user.avatar}</div>
                                                <span style={{ fontWeight: 700 }}>{user.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{user.email}</td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: user.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }}>
                                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: user.status === 'active' ? 'var(--success)' : 'var(--text-muted)', boxShadow: user.status === 'active' ? '0 0 6px var(--success)' : 'none' }} />
                                                {user.status === 'active' ? 'Online' : 'Offline'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 12 }}>{user.last_seen}</td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-ghost" style={{ padding: '4px 8px', gap: 4, fontSize: 12 }}><Edit2 size={11} /></button>
                                                {user.role !== 'Owner' && <button className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDeleteUser(user.id)}><Trash2 size={11} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Tab: Security ─────────────────────────────────────────── */}
            {tab === 'security' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* 2FA */}
                    <div className="card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={16} color="var(--accent)" /> Two-Factor Auth</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Require 2FA for all admin actions</p>
                        {users.map(u => (
                            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</span>
                                {u.role !== 'Viewer'
                                    ? <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={13} /> Enabled</span>
                                    : <span style={{ color: 'var(--warning)', fontSize: 12, fontWeight: 700 }}>⚠ Not set</span>
                                }
                            </div>
                        ))}
                    </div>

                    {/* Session policy */}
                    <div className="card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} color="var(--accent)" /> Session Policy</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Control session timeouts and IP rules</p>
                        {[
                            { label: 'Session Timeout', value: '8 hours', color: 'var(--text-primary)' },
                            { label: 'IP Allowlist', value: 'Disabled', color: 'var(--warning)' },
                            { label: 'Concurrent Sessions', value: '3 max', color: 'var(--text-primary)' },
                            { label: 'Audit Logging', value: 'Enabled', color: 'var(--success)' },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.value}</span>
                            </div>
                        ))}
                        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 20, gap: 8 }}>
                            <Settings size={14} /> Edit Policy
                        </button>
                    </div>

                    {/* Active sessions */}
                    <div className="card" style={{ padding: 24, gridColumn: '1 / -1' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={16} color="var(--accent)" /> Active Sessions</h3>
                        {sessions.map((s) => (
                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13 }}>{s.user} {s.current && <span style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 10, background: 'rgba(34,197,94,0.12)', color: 'var(--success)', fontSize: 10, fontWeight: 800 }}>CURRENT</span>}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.device} • {s.ip} • {s.location}</div>
                                </div>
                                {!s.current && <button className="btn btn-ghost" style={{ color: 'var(--danger)', fontSize: 12, gap: 4 }} onClick={() => handleRevokeSession(s.id)}><AlertTriangle size={12} /> Revoke</button>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Tab: API Keys ─────────────────────────────────────────── */}
            {tab === 'api' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>API keys allow third-party services to access your tenant data securely.</p>
                        <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => setShowKeyModal(true)}><Plus size={14} /> Create Key</button>
                    </div>
                    {apiKeys.map(k => (
                        <div key={k.id} className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{k.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Created {k.created} • Last used {k.last_used}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-secondary" style={{ gap: 6, fontSize: 12 }}><Edit2 size={12} /> Edit</button>
                                    <button className="btn btn-ghost" style={{ color: 'var(--danger)', fontSize: 12 }} onClick={() => handleRevokeKey(k.id)}><Trash2 size={12} /> Revoke</button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
                                <Key size={14} color="var(--text-muted)" />
                                <code style={{ fontSize: 13, flex: 1, letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>
                                    {showKey === k.id ? k.key.replace('...', 'xxxxxxxxxxxx') : k.key}
                                </code>
                                <button onClick={() => setShowKey(showKey === k.id ? null : k.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showKey === k.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button onClick={() => copyKey(k.id, k.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === k.id ? 'var(--success)' : 'var(--text-muted)' }}>
                                    {copied === k.id ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {k.scopes?.map((sc: string) => (
                                    <span key={sc} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>{sc}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tab: System ─────────────────────────────────────────── */}
            {tab === 'system' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* System Status */}
                    <div className="card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Server size={16} color="var(--accent)" /> Service Status</h3>
                        {[
                            { label: 'API Gateway', status: 'Operational', ms: '38ms avg' },
                            { label: 'PostgreSQL DB', status: 'Operational', ms: 'Lag: 12ms' },
                            { label: 'Redis Cache', status: 'Operational', ms: 'Hit rate: 94%' },
                            { label: 'AI Pipeline', status: 'Operational', ms: 'Init: 240ms' },
                            { label: 'Webhooks', status: 'Degraded', ms: '84% capacity' },
                        ].map(svc => (
                            <div key={svc.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{svc.label}</span>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: svc.status === 'Operational' ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: svc.status === 'Operational' ? 'var(--success)' : 'var(--warning)' }} />
                                        {svc.status}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{svc.ms}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tenant Settings */}
                    <div className="card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Settings size={16} color="var(--accent)" /> Tenant Config</h3>
                        {[
                            { label: 'Plan', value: 'Enterprise' },
                            { label: 'Tenant ID', value: tenantId ? `${tenantId.toString().slice(0, 8)}...` : '—' },
                            { label: 'AI Model', value: 'claude-3-5-haiku' },
                            { label: 'Max Agents', value: '10 active' },
                            { label: 'Voice Minutes', value: '500 / mo' },
                        ].map(cfg => (
                            <div key={cfg.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{cfg.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{cfg.value}</span>
                            </div>
                        ))}
                        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 20, gap: 8 }}>
                            <Edit2 size={13} /> Edit Config
                        </button>
                    </div>

                    {/* Danger zone */}
                    <div className="card" style={{ padding: 24, gridColumn: '1 / -1', borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.03)' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>⚠ Danger Zone</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>These actions are irreversible. Proceed with caution.</p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger)', gap: 8 }}>
                                <RefreshCw size={13} /> Reset All Agent Memory
                            </button>
                            <button className="btn btn-secondary" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger)', gap: 8 }}>
                                <Database size={13} /> Purge Conversation Logs
                            </button>
                            <button className="btn btn-secondary" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger)', gap: 8 }}>
                                <AlertTriangle size={13} /> Delete Tenant Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Modals ─────────────────────────────────────────────── */}

            {showInviteModal && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99 }} onClick={() => setShowInviteModal(false)} />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 440, background: 'var(--bg-main)', borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.4)', border: '1px solid var(--border)', zIndex: 100, padding: 32 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Invite Team Member</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Full Name</label>
                                <input className="input" placeholder="John Doe" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Email Address</label>
                                <input className="input" placeholder="john@company.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Role</label>
                                <select className="input" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowInviteModal(false)}>Cancel</button>
                                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleInvite}>Send Invite</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {showKeyModal && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99 }} onClick={() => setShowKeyModal(false)} />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 440, background: 'var(--bg-main)', borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.4)', border: '1px solid var(--border)', zIndex: 100, padding: 32 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Create API Key</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Key Label</label>
                                <input className="input" placeholder="e.g. CRM Integration" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
                            </div>
                            <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.06)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', fontSize: 12, color: 'var(--text-secondary)' }}>
                                <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>Note:</div>
                                For security, you will only be able to see the full key once after creation.
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowKeyModal(false)}>Cancel</button>
                                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCreateKey}>Generate Key</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
