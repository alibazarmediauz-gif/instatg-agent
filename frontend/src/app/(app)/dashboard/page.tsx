'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useCurrency } from '@/lib/CurrencyContext';
import {
    Activity, DollarSign, Phone, TrendingUp, AlertTriangle,
    Zap, Clock, ShieldAlert, Cpu, Network, CheckCircle2, XCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { getAnalyticsDashboard } from '@/lib/api';

const mockPulseData = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    latency: 120 + Math.random() * 50,
    cost: Math.random() * 2
}));

export default function ControlCenter() {
    const { tenantId } = useTenant();
    const { t } = useLanguage();
    const { formatCurrency } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const fetchDashboard = async () => {
        try {
            const json = await getAnalyticsDashboard(tenantId, 0) as any;
            if (json.status === 'success') {
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, [tenantId]);

    if (loading || !data) {
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

    const { kpis, funnelData } = data;

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>{t('nav.control_center')}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('topbar.dashboard_subtitle')} | {t('nav.test_key')}</p>
                </div>
                <div className="status-badge">
                    <div className="status-dot" />
                    {t('dashboard_metrics.all_ok') || 'System Operational [v2.0.1]'}
                </div>
            </div>

            {/* ─── Top KPI Row ─── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 20,
                marginBottom: 32
            }}>
                <MiniStatCard label={t('dashboard_metrics.wallet_balance') || 'Wallet Balance'} value={formatCurrency(1240.50)} sub={t('dashboard_metrics.prepaid') || 'Prepaid'} icon={<DollarSign size={14} />} color="var(--success)" />
                <MiniStatCard label={t('dashboard_metrics.revenue_today') || 'Revenue Today'} value={formatCurrency(kpis.total_revenue || 0, 0, 0)} sub="+12.4%" icon={<TrendingUp size={14} />} color="var(--accent)" />
                <MiniStatCard label={t('dashboard_metrics.ai_cost_today') || 'AI Cost Today'} value={formatCurrency(kpis.total_cost || 0, 2, 4)} sub="0.003/msg" icon={<Cpu size={14} />} color="var(--warning)" />
                <MiniStatCard label={t('dashboard_metrics.profit_margin') || 'Profit Margin'} value={`${Math.max(0, 100 - (kpis.total_cost / (kpis.total_revenue || 1) * 100)).toFixed(1)}%`} sub="Target: 95%" icon={<Activity size={14} />} color="var(--success)" />
                <MiniStatCard label={t('dashboard_metrics.calls_today') || 'Calls Today'} value={funnelData[0]?.value || 0} sub={t('dashboard_metrics.outbound') || 'Outbound'} icon={<Phone size={14} />} color="var(--purple)" />
                <MiniStatCard label={t('dashboard_metrics.active_calls') || 'Active Calls'} value="0" sub={t('dashboard_metrics.live_pulse') || 'Live Pulse'} icon={<Activity size={14} />} color="var(--danger)" pulse />
                <MiniStatCard label={t('dashboard_metrics.ai_conv_rate') || 'AI Conv. Rate'} value={`${Number(kpis.roi) > 0 ? '14.2' : '0'}%`} sub="+2.1% w/w" icon={<Zap size={14} />} color="var(--accent)" />
            </div>

            {/* ─── Main Content Grid ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* MIDDLE SECTION: Activity & Escalations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Live Activity Stream */}
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Activity size={16} color="var(--accent)" />
                                {t('dashboard_metrics.live_activity') || 'Live Activity Stream'}
                            </h3>
                            <span className="badge info">{t('dashboard_metrics.listening') || 'Listening'} (wss://)</span>
                        </div>
                        <div style={{ padding: '0' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('dashboard_metrics.timestamp') || 'Timestamp'}</th>
                                        <th>{t('dashboard_metrics.event_type') || 'Event Type'}</th>
                                        <th>{t('dashboard_metrics.details') || 'Details'}</th>
                                        <th>{t('common.status') || 'Status'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <ActivityRow time="10:42:15" type="inbound_call" detail="+1 (555) 019-2831 connected to VoiceAgent-Alpha" status="Processing" statusColor="var(--warning)" />
                                    <ActivityRow time="10:42:12" type="payment_intent" detail="Stripe captured $140.00 (Lead ID: 8991)" status="Success" statusColor="var(--success)" />
                                    <ActivityRow time="10:42:05" type="webhook_recv" detail="Meta Graph API message from ig_user_991" status="Success" statusColor="var(--success)" />
                                    <ActivityRow time="10:41:58" type="llm_generation" detail="Generated 240 tokens in 410ms (GPT-4o)" status="Success" statusColor="var(--success)" />
                                    <ActivityRow time="10:41:10" type="outbound_dial" detail="Campaign 'Q3 Reactivation' dialed +1 (555) 991-0021" status="Failed" statusColor="var(--danger)" />
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Alerts & SLAs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div className="card">
                            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ShieldAlert size={16} color="var(--danger)" />
                                {t('dashboard_metrics.escalation_alerts') || 'Escalation Alerts'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <AlertItem title="Angry Customer Detected" desc="Voice sentiment hit -0.85" id="Call-9912" time="2m ago" />
                                <AlertItem title="Complex Query" desc="Knowledge base returned 0.1 confidence" id="Chat-1102" time="5m ago" />
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Clock size={16} color="var(--warning)" />
                                {t('dashboard_metrics.human_sla') || 'Human SLA Timer'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{t('dashboard_metrics.first_response_time') || 'First Response Time'}</span>
                                        <span style={{ fontWeight: 600, color: 'var(--success)' }}>1m 12s</span>
                                    </div>
                                    <div className="progress-bar"><div className="progress-fill" style={{ width: '15%', background: 'var(--success)' }} /></div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{t('dashboard_metrics.escalation_resolution') || 'Escalation Resolution'}</span>
                                        <span style={{ fontWeight: 600, color: 'var(--danger)' }}>14m 30s ({t('dashboard_metrics.sla_breach') || 'SLA Breach Risk'})</span>
                                    </div>
                                    <div className="progress-bar"><div className="progress-fill" style={{ width: '85%', background: 'var(--danger)' }} /></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

/* ─── Components ─── */

function MiniStatCard({ label, value, sub, icon, color, pulse = false }: any) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: pulse ? `0 0 20px -5px ${color}` : 'none',
            minHeight: '120px',
            justifyContent: 'center'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <div style={{ color, display: 'flex', alignItems: 'center' }}>
                    {pulse && <div className="status-dot" style={{ background: color, marginRight: 6 }} />}
                    {icon}
                </div>
            </div>
            <div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>
            </div>
        </div>
    );
}

function ActivityRow({ time, type, detail, status, statusColor }: any) {
    return (
        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', padding: '16px 20px' }}>{time}</td>
            <td style={{ padding: '16px 20px' }}><span className="badge neutral">{type}</span></td>
            <td style={{ width: '100%', padding: '16px 20px' }}>{detail}</td>
            <td style={{ padding: '16px 20px' }}><span style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>{status}</span></td>
        </tr>
    );
}

function AlertItem({ title, desc, id, time }: any) {
    return (
        <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>{title}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{time}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{desc}</div>
            <button className="btn btn-sm btn-secondary" style={{ fontSize: 11, padding: '4px 8px' }}>Review {id}</button>
        </div>
    );
}

function HealthRow({ label, status, ok, color }: any) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                {ok ? <CheckCircle2 size={16} color="var(--success)" /> : <AlertTriangle size={16} color={color} />}
                {label}
            </span>
            <span style={{ fontWeight: 600, color: ok ? 'var(--success)' : color }}>{status}</span>
        </div>
    );
}
