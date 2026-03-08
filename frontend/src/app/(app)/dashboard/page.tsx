'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { useLanguage } from '@/lib/LanguageContext';
import {
    Activity, ShieldAlert, Cpu, Network, CheckCircle2,
    Clock, AlertTriangle, Bot, Zap, PlayCircle, BarChart
} from 'lucide-react';
import { getAnalyticsDashboard } from '@/lib/api';

export default function ControlCenter() {
    const { tenantId } = useTenant();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);

    // Simulated real-time execution feed for the premium demo feel
    const [executionLogs, setExecutionLogs] = useState([
        { id: 1, time: '10:42:01', agent: 'SDR_Sarah', action: 'Tool Call', detail: 'lookup_lead(id: 402)', status: 'Success', statusColor: 'var(--success)' },
        { id: 2, time: '10:41:45', agent: 'SDR_Sarah', action: 'Reasoning', detail: 'Lead requested pricing, drafting enterprise proposal.', status: 'Executing', statusColor: 'var(--accent)' },
        { id: 3, time: '10:40:12', agent: 'Support_BotX', action: 'Tool Call', detail: 'update_crm_status(id: 89, status: "resolved")', status: 'Success', statusColor: 'var(--success)' },
        { id: 4, time: '10:38:50', agent: 'SDR_Sarah', action: 'Escalation', detail: 'Complex objection detected. Routing to human operator.', status: 'Escalated', statusColor: 'var(--warning)' },
    ]);

    const fetchDashboard = async () => {
        setLoading(false);
    };

    useEffect(() => {
        fetchDashboard();
    }, [tenantId]);

    if (loading) {
        return (
            <div className="page-container animate-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text-muted)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                        <div>Initializing Control Center...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>⌘ Command Center</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Real-time orchestration and observability of your AI sales workforce.</p>
                </div>
                <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success)', borderRadius: 24, fontWeight: 700, fontSize: 12 }}>
                    <div className="status-dot animate-pulse" style={{ background: 'var(--success)', width: 8, height: 8 }} />
                    ALL SYSTEMS NOMINAL
                </div>
            </div>

            {/* ─── Top KPI Row ─── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 20,
                marginBottom: 32
            }}>
                <MiniStatCard label="Active Agents" value="4" sub="2 Voice, 2 Chat" icon={<Bot size={14} />} color="var(--accent)" index={0} />
                <MiniStatCard label="Actions Executed" value="1,204" sub="Today" icon={<PlayCircle size={14} />} color="var(--purple)" index={1} />
                <MiniStatCard label="Task Success Rate" value="98.2%" sub="Trajectory Steady" icon={<CheckCircle2 size={14} />} color="var(--success)" index={2} />
                <MiniStatCard label="Human Interventions" value="12" sub="-4% vs yesterday" icon={<ShieldAlert size={14} />} color="var(--warning)" index={3} />
                <MiniStatCard label="Action Latency" value="142ms" sub="Avg Tool Exe Time" icon={<Zap size={14} />} color="var(--accent)" index={4} />
            </div>

            {/* ─── Main Content Grid ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

                {/* LEFT: Live Execution Feed */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace' }}>
                            <Activity size={16} color="var(--accent)" />
                            GLOBAL_EXECUTION_LOG
                        </h3>
                        <span className="badge info" style={{ fontFamily: 'monospace', fontSize: 11 }}>TAILING...</span>
                    </div>
                    <div style={{ padding: 0, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                <tr>
                                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Time</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Agent</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Type</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Payload / Details</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {executionLogs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: 12 }}>
                                        <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{log.time}</td>
                                        <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Bot size={14} color="var(--accent)" /> {log.agent}</span></td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800,
                                                background: log.action === 'Tool Call' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                color: log.action === 'Tool Call' ? 'var(--purple)' : 'var(--accent)'
                                            }}>{log.action}</span>
                                        </td>
                                        <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{log.detail}</td>
                                        <td style={{ padding: '16px 20px', color: log.statusColor, fontWeight: 700 }}>{log.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT: Approvals & Health */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Action Queue Preview */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ShieldAlert size={16} color="var(--warning)" />
                                Pending HITL Approvals
                            </h3>
                        </div>
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', fontFamily: 'monospace' }}>AUTH_REQUIRED</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>2m ago</span>
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>Agent <b>SDR_Sarah</b> attempting to send formal quote to <b>Acme Corp</b>.</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-primary btn-sm" style={{ flex: 1, padding: '6px' }}>Review & Approve</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Integrations Health */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Network size={16} color="var(--text-primary)" />
                                Integration Uplink
                            </h3>
                        </div>
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <HealthRow label="amoCRM API Sync" status="Operational" ok={true} />
                            <HealthRow label="Telegram Webhooks" status="Operational" ok={true} />
                            <HealthRow label="OpenAI Inference" status="Operational" ok={true} />
                            <HealthRow label="WhatsApp API" status="Unconfigured" ok={false} color="var(--text-muted)" icon={<AlertTriangle size={16} color="var(--text-muted)" />} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

/* ─── Components ─── */

function MiniStatCard({ label, value, sub, icon, color, index = 0 }: any) {
    return (
        <div
            className="card card-premium animate-entrance"
            style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                minHeight: '140px',
                justifyContent: 'center',
                animationDelay: `${index * 0.1}s`,
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 24,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{
                position: 'absolute', top: '-20%', right: '-20%', width: '50%', height: '50%',
                background: color, filter: 'blur(40px)', opacity: 0.1, zIndex: 0
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
                <div style={{
                    width: 32, height: 32, borderRadius: 10, background: `${color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color
                }}>
                    {icon}
                </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text-primary)' }}>{value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{sub}</div>
                </div>
            </div>
        </div>
    );
}

function HealthRow({ label, status, ok, color, icon }: any) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {icon ? icon : (ok ? <CheckCircle2 size={16} color="var(--success)" /> : <AlertTriangle size={16} color={color} />)}
                {label}
            </span>
            <span style={{ fontWeight: 700, color: icon ? color : (ok ? 'var(--success)' : color), fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</span>
        </div>
    );
}
