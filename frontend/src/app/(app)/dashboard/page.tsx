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
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('topbar.dashboard_subtitle')}</p>
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
                <MiniStatCard label={t('dashboard_metrics.wallet_balance') || 'Wallet Balance'} value={formatCurrency(1240.50)} sub={t('dashboard_metrics.prepaid') || 'Prepaid'} icon={<DollarSign size={14} />} color="var(--success)" index={0} />
                <MiniStatCard label={t('dashboard_metrics.revenue_today') || 'Revenue Today'} value={formatCurrency(kpis.total_revenue || 0, 0, 0)} sub="+12.4%" icon={<TrendingUp size={14} />} color="var(--accent)" index={1} />
                <MiniStatCard label={t('dashboard_metrics.ai_cost_today') || 'AI Cost Today'} value={formatCurrency(kpis.total_cost || 0, 2, 4)} sub="0.003/msg" icon={<Cpu size={14} />} color="var(--warning)" index={2} />
                <MiniStatCard label={t('dashboard_metrics.profit_margin') || 'Profit Margin'} value={`${Math.max(0, 100 - (kpis.total_cost / (kpis.total_revenue || 1) * 100)).toFixed(1)}%`} sub="Target: 95%" icon={<Activity size={14} />} color="var(--success)" index={3} />
                <MiniStatCard label={t('dashboard_metrics.calls_today') || 'Calls Today'} value={funnelData[0]?.value || 0} sub={t('dashboard_metrics.outbound') || 'Outbound'} icon={<Phone size={14} />} color="var(--purple)" index={4} />
                <MiniStatCard label={t('dashboard_metrics.active_calls') || 'Active Calls'} value="0" sub={t('dashboard_metrics.live_pulse') || 'Live Pulse'} icon={<Activity size={14} />} color="var(--danger)" pulse index={5} />
                <MiniStatCard label={t('dashboard_metrics.ai_conv_rate') || 'AI Conv. Rate'} value={`${Number(kpis.roi) > 0 ? '14.2' : '0'}%`} sub="+2.1% w/w" icon={<Zap size={14} />} color="var(--accent)" index={6} />
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
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: 13 }}>
                                            {t('dashboard_metrics.no_activity') || 'No recent activity recorded.'}
                                        </td>
                                    </tr>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>
                                {t('dashboard_metrics.no_alerts') || 'All clear. No active alerts.'}
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Clock size={16} color="var(--warning)" />
                                {t('dashboard_metrics.human_sla') || 'Human SLA Timer'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>
                                {t('dashboard_metrics.no_slas') || 'No active escalations tracking SLA.'}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

/* ─── Components ─── */

function MiniStatCard({ label, value, sub, icon, color, pulse = false, index = 0 }: any) {
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
            {/* Background glow for the card */}
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
                    {pulse && <div className="status-dot animate-pulse" style={{ background: color, width: 6, height: 6 }} />}
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{sub}</div>
                </div>
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
