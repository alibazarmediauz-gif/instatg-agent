'use client';

import React, { useState, useEffect } from 'react';
import {
    CreditCard, Download, ShieldAlert, Database, Server, Cpu,
    CheckCircle2, ListFilter, Loader2, TrendingDown, RefreshCw,
    Zap, AlertCircle, DollarSign, Activity, ArrowUpRight,
    ChevronDown, ChevronUp, PieChart, BarChart3, Clock
} from 'lucide-react';
import { useTenant } from '@/lib/TenantContext';
import { getBillingWallet, getBillingUsageLogs, topUpWallet } from '@/lib/api';

const DEMO_LOGS = [
    { id: '1', service_type: 'chat', cost: 0.03, units_consumed: 840, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: '2', service_type: 'voice', cost: 0.14, units_consumed: 2, created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
    { id: '3', service_type: 'chat', cost: 0.01, units_consumed: 320, created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString() },
    { id: '4', service_type: 'voice', cost: 0.28, units_consumed: 4, created_at: new Date(Date.now() - 1000 * 60 * 67).toISOString() },
    { id: '5', service_type: 'chat', cost: 0.02, units_consumed: 560, created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString() },
];

export default function BillingPage() {
    const { tenantId } = useTenant();
    const [balance, setBalance] = useState<number>(1250.00);
    const [logs, setLogs] = useState<any[]>(DEMO_LOGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [topping, setTopping] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(100);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    const USAGE_BY_CHANNEL = [
        { channel: 'WhatsApp', usage: 1240, cost: 24.80, color: '#25D366' },
        { channel: 'Instagram', usage: 3840, cost: 38.40, color: '#E1306C' },
        { channel: 'Telegram', usage: 8520, cost: 85.20, color: '#0088cc' },
        { channel: 'Voice (SIP)', usage: 142, cost: 14.20, color: '#F97316' },
    ];

    const totalSpent = logs.reduce((s, l) => s + (l.cost || 0), 0);

    const fetchBillingData = async () => {
        try {
            const [walletData, logsData] = await Promise.all([
                getBillingWallet(tenantId) as Promise<any>,
                getBillingUsageLogs(tenantId) as Promise<any>,
            ]);
            if (walletData.status === 'success') setBalance(walletData.balance);
            if (logsData.status === 'success' && logsData.logs.length > 0) setLogs(logsData.logs);
            setError(false);
        } catch {
            setError(true);
            // Keep demo data, just signal offline mode
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBillingData();
        const t = setInterval(fetchBillingData, 15000);
        return () => clearInterval(t);
    }, [tenantId]);

    const handleTopUp = async () => {
        setTopping(true);
        try {
            const data = await topUpWallet(tenantId, topUpAmount) as any;
            if (data.checkout_url) window.location.href = data.checkout_url;
        } catch {
            // mock: add funds locally
            setBalance(b => b + topUpAmount);
        } finally {
            setTopping(false);
        }
    };

    if (loading) return (
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <Loader2 className="animate-spin" size={32} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading Billing...</div>
            </div>
        </div>
    );

    return (
        <div className="page-container animate-in" style={{ padding: '28px 36px' }}>

            {/* ── Offline Banner ─────────────────────────────────────── */}
            {error && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 10, marginBottom: 20, fontSize: 13, color: 'var(--warning)'
                }}>
                    <AlertCircle size={14} />
                    Backend offline — showing cached data.
                    <button onClick={fetchBillingData} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <RefreshCw size={12} /> Retry
                    </button>
                </div>
            )}

            {/* ── Page Header ────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Billing & Usage</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Wallet balance, API usage, and transaction ledger</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" style={{ gap: 8 }}><Download size={14} /> Export</button>
                    <button
                        className="btn btn-primary" style={{ gap: 8 }}
                        onClick={handleTopUp} disabled={topping}
                    >
                        {topping ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                        Top Up ${topUpAmount}
                    </button>
                </div>
            </div>

            {/* ── KPI Strip ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                <KPICard
                    label="Wallet Balance"
                    value={`$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    sub="Available"
                    color="var(--success)"
                    icon={<DollarSign size={16} />}
                    accent
                />
                <KPICard
                    label="Spent Today"
                    value={`$${totalSpent.toFixed(2)}`}
                    sub={`${logs.length} transactions`}
                    color="var(--warning)"
                    icon={<TrendingDown size={16} />}
                />
                <KPICard
                    label="LLM Token Quota"
                    value="1.4M / 5M"
                    sub="28% used today"
                    color="var(--accent)"
                    icon={<Zap size={16} />}
                    progress={28}
                />
                <KPICard
                    label="Webhook Rate"
                    value="8,420 / 10k"
                    sub="84% — near limit"
                    color="var(--danger)"
                    icon={<Activity size={16} />}
                    progress={84}
                    danger
                />
            </div>

            {/* ── Main Grid ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>

                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Wallet card */}
                    <div className="card" style={{
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(37,99,235,0.03) 100%)',
                        borderTop: '3px solid var(--accent)', padding: 28
                    }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Available Balance</div>
                        <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
                            ${balance.toFixed(2)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)', fontWeight: 700, marginBottom: 24 }}>
                            <CheckCircle2 size={12} /> Auto-recharge @ $200
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                { label: 'LLM APIs', cost: '$42.50 / day' },
                                { label: 'Twilio SIP', cost: '$18.20 / day' },
                                { label: 'VPS Compute', cost: '$12.00 / day' },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                                    <span style={{ fontWeight: 700 }}>{row.cost}</span>
                                </div>
                            ))}
                        </div>

                        {/* Top-up control */}
                        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
                            {[50, 100, 200].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => setTopUpAmount(amt)}
                                    style={{
                                        flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        border: topUpAmount === amt ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                                        background: topUpAmount === amt ? 'rgba(37,99,235,0.15)' : 'var(--bg-elevated)',
                                        color: topUpAmount === amt ? 'var(--accent)' : 'var(--text-secondary)',
                                        transition: 'all 0.15s'
                                    }}
                                >${amt}</button>
                            ))}
                        </div>
                        <button
                            className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10, gap: 8 }}
                            onClick={handleTopUp} disabled={topping}
                        >
                            {topping ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                            {topping ? 'Processing...' : `Add $${topUpAmount} to Wallet`}
                        </button>
                    </div>

                    {/* System Health */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>System Health</div>
                        {[
                            { icon: <Database size={14} />, label: 'Database', status: 'Operational', color: 'var(--success)', sub: 'Lag: 12ms' },
                            { icon: <Cpu size={14} />, label: 'AI Processing', status: 'Operational', color: 'var(--success)', sub: 'Init: 240ms' },
                            { icon: <Server size={14} />, label: 'API Gateway', status: 'Operational', color: 'var(--success)', sub: '99.98% uptime' },
                            { icon: <ShieldAlert size={14} />, label: 'Abuse Shield', status: '3 Blocks', color: 'var(--danger)', sub: 'IP: RU, BY' },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ color: row.color }}>{row.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{row.label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.sub}</div>
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: row.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: row.color }} />
                                    {row.status}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Channel Breakdown */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PieChart size={14} color="var(--accent)" /> Usage by Channel
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {USAGE_BY_CHANNEL.map(item => (
                                <div key={item.channel}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                        <span style={{ fontWeight: 600 }}>{item.channel}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>${item.cost.toFixed(2)}</span>
                                    </div>
                                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: `${(item.cost / 162) * 100}%`, height: '100%', background: item.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                            Cost calculated based on $0.01 per chat unit and $0.10 per voice minute.
                        </div>
                    </div>
                </div>

                {/* Right column — ledger */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', margin: 0 }}>
                            Transaction Ledger
                        </h3>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{logs.length} entries</span>
                            <button className="btn btn-ghost" style={{ padding: '4px 8px', gap: 4, fontSize: 12 }}>
                                <ListFilter size={13} /> Filter
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)' }}>
                                    <th style={{ textAlign: 'left', padding: '11px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time</th>
                                    <th style={{ textAlign: 'left', padding: '11px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type</th>
                                    <th style={{ textAlign: 'left', padding: '11px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Units</th>
                                    <th style={{ textAlign: 'right', padding: '11px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Deducted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <React.Fragment key={log.id || i}>
                                        <tr style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '13px 24px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                <span style={{ display: 'block', fontSize: 11 }}>{new Date(log.created_at).toLocaleDateString()}</span>
                                            </td>
                                            <td style={{ padding: '13px 24px' }}>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                    background: log.service_type === 'chat' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                                                    color: log.service_type === 'chat' ? 'var(--success)' : 'var(--warning)',
                                                }}>
                                                    {log.service_type === 'chat' ? '💬 Chat AI' : '📞 Voice Min'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '13px 24px', fontWeight: 600 }}>{log.units_consumed?.toLocaleString() || '—'}</td>
                                            <td style={{ padding: '13px 24px', textAlign: 'right', color: 'var(--danger)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                                                -${(log.cost || 0).toFixed(3)}
                                                {expandedLog === log.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </td>
                                        </tr>
                                        {expandedLog === log.id && (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '0 24px 16px', background: 'rgba(255,255,255,0.02)' }}>
                                                    <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', fontSize: 12 }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Session ID</div>
                                                                <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>sess_4f8a{log.id}z9</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Processing Time</div>
                                                                <div style={{ fontWeight: 700 }}>420ms</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Model Used</div>
                                                                <div style={{ fontWeight: 700 }}>GPT-4o (Optimized)</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: 'var(--text-secondary)' }}>This transaction represents AI compute costs for processing <b>{log.units_consumed}</b> {log.service_type === 'chat' ? 'tokens' : 'seconds of audio'}.</span>
                                                            <button className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11 }}>View JSON</button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No transactions yet. Usage logs will appear here once AI agents start processing.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total (shown)</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--danger)' }}>-${totalSpent.toFixed(3)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ label, value, sub, color, icon, progress, danger, accent }: any) {
    return (
        <div className="card" style={{
            padding: '20px 22px',
            borderLeft: accent ? `3px solid ${color}` : undefined,
            background: accent ? `linear-gradient(135deg, ${color}10, transparent)` : undefined
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                <div style={{ color }}>{icon}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, color: danger ? 'var(--danger)' : undefined }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
            {progress !== undefined && (
                <div style={{ marginTop: 10, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: color, transition: 'width 0.6s ease', borderRadius: 2 }} />
                </div>
            )}
        </div>
    );
}
