'use client';

import { useState } from 'react';
import {
    BarChart3, Activity, ShieldAlert, Zap, AlertTriangle,
    PlayCircle, CheckCircle2, Crosshair, Users
} from 'lucide-react';

export default function ActionAnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState('7d');

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <BarChart3 size={28} color="var(--accent)" /> Action & Execution Analytics
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Deep observability into agent behavior, tool execution success, and human oversight.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['24h', '7d', '30d', 'All Time'].map(range => (
                        <button
                            key={range}
                            className={`btn btn-sm ${timeRange === range ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Top KPI Row ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
                <AnalyticsCard label="Actions Executed" value="14,204" percent="+12%" positive icon={<PlayCircle size={16} />} color="var(--purple)" />
                <AnalyticsCard label="Task Success Rate" value="96.8%" percent="+1.2%" positive icon={<CheckCircle2 size={16} />} color="var(--success)" />
                <AnalyticsCard label="Human Takeover Rate" value="4.2%" percent="-0.5%" positive icon={<Users size={16} />} color="var(--warning)" />
                <AnalyticsCard label="Avg Execution Latency" value="340ms" percent="-50ms" positive icon={<Zap size={16} />} color="var(--accent)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>

                {/* LEFT: Execution Volume / Tool Usage */}
                <div className="card" style={{ padding: 24, background: 'var(--bg-elevated)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700 }}>Tool Usage Distribution</h3>
                        <span className="badge neutral">Last 7 Days</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <UsageBar label="amoCRM.update_lead" value={4201} max={5000} color="var(--accent)" />
                        <UsageBar label="telegram.send_message" value={3840} max={5000} color="var(--purple)" />
                        <UsageBar label="calendar.book_meeting" value={1204} max={5000} color="var(--success)" />
                        <UsageBar label="billing.draft_proposal" value={482} max={5000} color="var(--warning)" />
                        <UsageBar label="kb.search_objection" value={980} max={5000} color="var(--text-muted)" />
                    </div>
                </div>

                {/* RIGHT: Agent Performance Leaderboard */}
                <div className="card" style={{ padding: 24, background: 'var(--bg-elevated)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700 }}>Agent Success Matrix</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <AgentLeader label="SDR_Sarah" success="98%" executions="8,204" />
                        <AgentLeader label="Support_BotX" success="95%" executions="4,820" />
                        <AgentLeader label="Closer_Mike" success="82%" executions="1,180" warning />
                    </div>
                </div>
            </div>

            {/* BOTTOM: Quality Control & Anomalies */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShieldAlert size={16} /> Quality Control: Anomalies & Failed Executions
                    </h3>
                    <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>Export Audit Log</button>
                </div>
                <div style={{ padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <thead style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Timestamp</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Agent</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Anomaly Type</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Details</th>
                                <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Severity</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Today, 10:42 AM</td>
                                <td style={{ padding: '16px 20px', fontWeight: 600 }}>Closer_Mike</td>
                                <td style={{ padding: '16px 20px' }}><span className="badge danger">Hallucination Risk</span></td>
                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Generated pricing tier not found in knowledge base.</td>
                                <td style={{ padding: '16px 20px', color: 'var(--danger)', fontWeight: 700 }}>HIGH</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Yesterday, 14:12 PM</td>
                                <td style={{ padding: '16px 20px', fontWeight: 600 }}>SDR_Sarah</td>
                                <td style={{ padding: '16px 20px' }}><span className="badge warning">Tool Auth Failure</span></td>
                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Attempted to use `billing.draft_proposal` without write permissions.</td>
                                <td style={{ padding: '16px 20px', color: 'var(--warning)', fontWeight: 700 }}>MEDIUM</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Yesterday, 09:05 AM</td>
                                <td style={{ padding: '16px 20px', fontWeight: 600 }}>Support_BotX</td>
                                <td style={{ padding: '16px 20px' }}><span className="badge neutral">Schema Mismatch</span></td>
                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Failed to parse CRM response due to missing dynamic field. Auto-recovered.</td>
                                <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 700 }}>LOW</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Subcomponents

function AnalyticsCard({ label, value, percent, positive, icon, color }: any) {
    return (
        <div className="card" style={{ padding: 24, borderTop: `4px solid ${color}`, background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
                <div style={{ padding: 6, background: `${color}15`, borderRadius: 8, color }}>
                    {icon}
                </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: positive ? 'var(--success)' : 'var(--danger)' }}>
                {percent} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>vs previous period</span>
            </div>
        </div>
    );
}

function UsageBar({ label, value, max, color }: any) {
    const width = `${(value / max) * 100}%`;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{value.toLocaleString()}</span>
            </div>
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width, height: '100%', background: color, borderRadius: 4 }} />
            </div>
        </div>
    );
}

function AgentLeader({ label, success, executions, warning = false }: any) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: warning ? 'rgba(245, 158, 11, 0.1)' : 'rgba(52, 211, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {warning ? <AlertTriangle size={14} color="var(--warning)" /> : <CheckCircle2 size={14} color="var(--success)" />}
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{executions} actions executed</div>
                </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: warning ? 'var(--warning)' : 'var(--success)' }}>
                {success}
            </div>
        </div>
    );
}
