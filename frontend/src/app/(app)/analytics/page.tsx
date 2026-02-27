'use client';

import { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, DollarSign, Activity,
    Users, ArrowUpRight, ArrowDownRight, Target, PieChart as PieChartIcon,
    Loader2
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid, Legend, ComposedChart, Line
} from 'recharts';
import { useTenant } from '@/lib/TenantContext';
import { getAnalyticsDashboard } from '@/lib/api';

const DONUT_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b'];

export default function AnalyticsPage() {
    const { tenantId } = useTenant();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const fetchAnalytics = async () => {
        try {
            const json = await getAnalyticsDashboard(tenantId, 7) as any;
            if (json.status === 'success') {
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 30000);
        return () => clearInterval(interval);
    }, [tenantId]);

    if (loading || !data) {
        return (
            <div className="page-container animate-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text-muted)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Loader2 className="animate-spin" size={32} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
                        <div>Aggregating Enterprise Analytics...</div>
                    </div>
                </div>
            </div>
        );
    }

    const { kpis, revenueData, funnelData, performanceData, retentionData } = data;

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px' }}>
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Revenue & Performance Analytics</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>ROI, drop-offs, and comparative AI/Human efficiency metrics.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select className="input" style={{ width: 140, background: 'var(--bg-elevated)', height: 36, fontSize: 13 }}>
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>This Quarter</option>
                    </select>
                    <button className="btn btn-primary" style={{ height: 36 }}>Export CSV</button>
                </div>
            </div>

            {/* ─── Top KPI Row (ROI Focus) ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
                <AnalyticsCard title="Total Revenue Generated" value={`$${kpis.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} trend="+14.2%" up={true} icon={<DollarSign size={18} />} color="#22c55e" />
                <AnalyticsCard title="Total AI Cost" value={`$${kpis.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} trend="+2.1%" up={false} icon={<Activity size={18} />} color="#ef4444" />
                <AnalyticsCard title="Campaign ROI" value={`${kpis.roi.toFixed(1)}%`} trend="+410%" up={true} icon={<TrendingUp size={18} />} color="#3b82f6" />
                <AnalyticsCard title="Blended Cost per Lead" value={`$${kpis.cpl.toFixed(2)}`} trend="-45%" up={true} icon={<Target size={18} />} color="#a855f7" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
                {/* ─── Revenue & Cost Over Time (Composed Chart) ─── */}
                <div className="card">
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 24 }}>Revenue vs Cost (AI vs Human)</h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#4a5568" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#4a5568" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: '#1c2230', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="voice" name="Voice AI Rev" stackId="a" fill="var(--accent)" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="chat" name="Chat AI Rev" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="cost" name="AI Compute Cost" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ─── Regional Distribution ─── */}
                <div className="card">
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 24 }}>Regional Distribution (UZ)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {data.regionData?.map((r: any) => (
                            <div key={r.city}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                    <span style={{ fontWeight: 600 }}>{r.city}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{r.leads} leads</span>
                                </div>
                                <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(r.leads / 450) * 100}%`, background: 'var(--accent)', borderRadius: 4 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Lead Source ROI & Performance ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
                <div className="card">
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 24 }}>Lead Source Performance</h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Source</th>
                                <th>Total Leads</th>
                                <th>Conv%</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.channelData?.map((c: any, i: number) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{c.source}</td>
                                    <td>{c.leads.toLocaleString()}</td>
                                    <td><span className={`badge ${c.conversion > 20 ? 'success' : 'warning'}`}>{c.conversion}%</span></td>
                                    <td>${c.revenue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 24 }}>Auto-Retention & Recovery</h3>
                    <div style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={retentionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#4a5568" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#4a5568" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: '#1c2230', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                <Area type="monotone" dataKey="active" name="Active" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActive)" />
                                <Area type="monotone" dataKey="recovered" name="Recovered" stroke="#22c55e" fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AnalyticsCard({ title, value, trend, up, icon, color }: any) {
    return (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: `3px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: up ? 'var(--success)' : 'var(--danger)', background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 12 }}>
                    {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend}
                </div>
            </div>
            <div>
                <h3 style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{title}</h3>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
            </div>
        </div>
    );
}
