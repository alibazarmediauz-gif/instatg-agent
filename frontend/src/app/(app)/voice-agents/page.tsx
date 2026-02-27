'use client';

import { useState, useEffect } from 'react';
import {
    Headset, Plus, Settings, Play, MoreVertical, Activity, PhoneCall,
    PhoneMissed, Clock, Signal, Mic, BarChart3, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useTenant } from '@/lib/TenantContext';
import { getVoiceAgents, createVoiceAgent, updateVoiceAgent } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { Check, X as CloseIcon, Loader2, Server, User, Lock, Globe } from 'lucide-react';

const mockLatencyData = Array.from({ length: 20 }).map((_, i) => ({
    time: i,
    val: 600 + Math.random() * 200 - 100
}));

export default function VoiceAgentsPage() {
    const { tenantId } = useTenant();
    const [loading, setLoading] = useState(true);
    const [agents, setAgents] = useState<any[]>([]);
    const [creating, setCreating] = useState(false);

    // SIP Config state
    const { t } = useLanguage();
    const [configAgent, setConfigAgent] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [sipForm, setSipForm] = useState({
        provider: 'beeline',
        server: '',
        port: '5060',
        username: '',
        password: '',
        transport: 'udp'
    });

    const fetchAgents = async () => {
        try {
            const data = await getVoiceAgents(tenantId) as any;
            if (data.status === 'success') {
                setAgents(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, [tenantId]);

    const handleDeploy = async () => {
        setCreating(true);
        try {
            await createVoiceAgent(tenantId, {
                name: `Inbound SDR ${Math.floor(Math.random() * 100)}`,
                voice_id: 'alloy',
            });
            fetchAgents();
        } catch (error) {
            console.error(error);
        } finally {
            setCreating(false);
        }
    };

    const handleOpenConfig = (agent: any) => {
        setConfigAgent(agent);
        setSipForm({
            provider: agent.provider || 'beeline',
            server: agent.sip_config?.server || '',
            port: agent.sip_config?.port || '5060',
            username: agent.sip_config?.username || '',
            password: agent.sip_config?.password || '',
            transport: agent.sip_config?.transport || 'udp'
        });
    };

    const handleSaveSip = async () => {
        setSaving(true);
        try {
            await updateVoiceAgent(tenantId, configAgent.id, {
                provider: sipForm.provider,
                sip_config: {
                    server: sipForm.server,
                    port: sipForm.port,
                    username: sipForm.username,
                    password: sipForm.password,
                    transport: sipForm.transport
                }
            });
            setConfigAgent(null);
            fetchAgents();
        } catch (e) {
            alert("Error saving: " + e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container animate-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text-muted)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                        <div>Loading Telephony Metrics...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Voice Agents & Telephony</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Manage autonomous agents and monitor Twilio SIP trunk performance.</p>
                </div>
                <button className="btn btn-primary" style={{ gap: 8, height: 36, padding: '0 16px' }} onClick={handleDeploy} disabled={creating}>
                    <Plus size={16} /> Deploy New Agent
                </button>
            </div>

            {/* ─── Top Telephony KPI Row ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 32 }}>
                <KPICard title="Live Calls" value="0" sub="Concurrent" icon={<Activity size={16} />} color="var(--success)" pulse />
                <KPICard title="Calls Today" value="842" sub="Dialed" icon={<PhoneCall size={16} />} color="var(--accent)" />
                <KPICard title="Answer Rate" value="42.8%" sub="Connects" icon={<Signal size={16} />} color="var(--warning)" />
                <KPICard title="Avg Duration" value="2m 14s" sub="Per Call" icon={<Clock size={16} />} color="var(--purple)" />
                <KPICard title="Failed / Dropped" value="1.2%" sub="Error Rate" icon={<PhoneMissed size={16} />} color="var(--danger)" />
                <KPICard title="Queue Size" value="0" sub="Waiting" icon={<Mic size={16} />} color="var(--text-secondary)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                {/* ─── Agents List ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Headset size={18} color="var(--accent)" /> Active Voice Agents
                    </h2>

                    {agents.length === 0 ? (
                        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No Voice Agents deployed. Create one to handle inbound/outbound calls.
                        </div>
                    ) : agents.map((agent: any) => (
                        <div key={agent.id} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
                            }}>
                                <Headset size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>{agent.name}</h3>
                                    <span className={`badge ${agent.is_active ? 'success' : 'neutral'}`}>{agent.is_active ? 'Active' : 'Idle'}</span>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {agent.system_prompt}
                                </p>
                                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><PhoneCall size={12} />Voice: {agent.voice_id}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 16px' }}><Play size={12} style={{ marginRight: 6 }} /> Test Call</button>
                                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 16px' }} onClick={() => handleOpenConfig(agent)}><Settings size={12} style={{ marginRight: 6 }} /> Configure SIP</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ─── Telephony Health & Call Logs ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                                Global ASR Latency (ms)
                            </h3>
                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--warning)' }}>~620ms</span>
                        </div>
                        <div style={{ height: 80, marginLeft: -20, marginBottom: -20 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockLatencyData}>
                                    <Area type="monotone" dataKey="val" stroke="var(--warning)" fill="rgba(245, 158, 11, 0.1)" strokeWidth={2} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                            <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                                Recent Call Logs
                            </h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <CallLogItem num="+1 (555) 019-2831" dur="2m 14s" status="Completed" intent="Qualified" agent="Inbound SDR" />
                            <CallLogItem num="+44 7700 900077" dur="4m 02s" status="Escalated" intent="Support" agent="Inbound SDR" />
                            <CallLogItem num="+1 (555) 882-1922" dur="0m 12s" status="Voicemail" intent="N/A" agent="Outbound Lead Gen" />
                            <CallLogItem num="+1 (800) 123-4567" dur="1m 45s" status="Completed" intent="Payment" agent="Billing Asst" />
                        </div>
                        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                            <button className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--accent)' }}>View All Call History</button>
                        </div>
                    </div>

                    <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <AlertCircle size={14} /> SIP Trunk Warnings
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Twilio US-East region is reporting elevated latency (expected +150ms). We are routing through EU-West where possible.
                        </p>
                    </div>
                </div>
            </div>
            {/* SIP Config Modal */}
            {configAgent && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1002, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card animate-in" style={{ width: 480, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800 }}>SIP Telephony Settings: {configAgent.name}</h3>
                            <button onClick={() => setConfigAgent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><CloseIcon size={18} /></button>
                        </div>

                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>SIP Provider (Uzbekistan)</label>
                                <select
                                    className="input"
                                    value={sipForm.provider}
                                    onChange={e => setSipForm({ ...sipForm, provider: e.target.value })}
                                >
                                    <option value="beeline">Beeline Business (SIP)</option>
                                    <option value="ucell">Ucell SIP</option>
                                    <option value="uztelecom">Uztelecom (Uzonline)</option>
                                    <option value="sip.uz">SIP.UZ / Sharq Telekom</option>
                                    <option value="custom">Custom SIP / Asterisk</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Server / Host</label>
                                    <div style={{ position: 'relative' }}>
                                        <Server size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                                        <input
                                            className="input" style={{ paddingLeft: 36 }}
                                            placeholder="sip.beeline.uz"
                                            value={sipForm.server}
                                            onChange={e => setSipForm({ ...sipForm, server: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Port</label>
                                    <input
                                        className="input" placeholder="5060"
                                        value={sipForm.port}
                                        onChange={e => setSipForm({ ...sipForm, port: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Username / Auth ID</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                                    <input
                                        className="input" style={{ paddingLeft: 36 }}
                                        placeholder="712000000"
                                        value={sipForm.username}
                                        onChange={e => setSipForm({ ...sipForm, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                                    <input
                                        type="password" className="input" style={{ paddingLeft: 36 }}
                                        placeholder="••••••••"
                                        value={sipForm.password}
                                        onChange={e => setSipForm({ ...sipForm, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Transport Protocol</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {['udp', 'tcp', 'tls'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setSipForm({ ...sipForm, transport: p })}
                                            style={{
                                                flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                background: sipForm.transport === p ? 'var(--accent)' : 'var(--bg-elevated)',
                                                color: sipForm.transport === p ? 'white' : 'var(--text-primary)',
                                                border: `1px solid ${sipForm.transport === p ? 'var(--accent)' : 'var(--border)'}`,
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, background: 'var(--bg-elevated)' }}>
                            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfigAgent(null)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, justifyContent: 'center', gap: 8 }}
                                onClick={handleSaveSip}
                                disabled={saving}
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                {saving ? 'Saving...' : 'Apply Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function KPICard({ title, value, sub, icon, color, pulse = false }: any) {
    return (
        <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: 12, boxShadow: pulse ? `0 0 15px -8px ${color}` : 'none'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{title}</span>
                <div style={{ color, display: 'flex', alignItems: 'center' }}>
                    {pulse && <div className="status-dot" style={{ background: color, marginRight: 6 }} />}
                    {icon}
                </div>
            </div>
            <div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontWeight: 600 }}>{sub}</div>
            </div>
        </div>
    );
}

function CallLogItem({ num, dur, status, intent, agent }: any) {
    return (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{num}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{agent} • {dur}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: status === 'Completed' ? 'var(--success)' : status === 'Escalated' ? 'var(--danger)' : 'var(--text-secondary)', marginBottom: 4 }}>{status}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-secondary)', display: 'inline-block', padding: '2px 6px', borderRadius: 4 }}>{intent}</div>
            </div>
        </div>
    );
}
