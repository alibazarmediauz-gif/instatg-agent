'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { getReports, getReport } from '@/lib/api';
import {
    MessageSquare, Bot, TrendingUp, DollarSign,
    Download, Mail, Share2, ArrowUpRight, ArrowDownRight,
    Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
} from 'recharts';

/* ─── Types ───────────────────────────────────────────── */
interface ReportSummary {
    id: string;
    report_date: string;
    total_conversations: number;
    conversations_handled: number;
    conversations_missed: number;
    conversion_rate: number;
}

interface ReportFull extends ReportSummary {
    top_scripts: { phrase: string; success_rate: number }[];
    common_objections: { phrase: string; frequency: number }[];
    voice_summary: string;
    comparison_data: any;
    full_report: {
        outcome_distribution: Record<string, number>;
        handoff_reasons: { reason: string; pct: number }[];
        best_script: { text: string; win_rate: number };
        worst_script: { text: string; dropoff_rate: number };
        weekly_volume: { day: string; chats: number; resolved: number }[];
        voice_emotion_score: number;
    } | null;
}

const DONUT_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444'];

export default function ReportsPage() {
    const { tenantId } = useTenant();

    const [reports, setReports] = useState<ReportSummary[]>([]);
    const [selectedReport, setSelectedReport] = useState<ReportFull | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const res = await getReports(tenantId, 30) as { reports: ReportSummary[] };
                setReports(res.reports || []);
                if ((res.reports?.length ?? 0) > 0) {
                    loadReport(res.reports[0].id);
                }
            } catch (e) {
                console.error('Failed to load reports:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [tenantId]);

    async function loadReport(id: string) {
        try {
            const r = await getReport(id, tenantId) as ReportFull;
            setSelectedReport(r);
        } catch (e) {
            console.error('Failed to load report:', e);
        }
    }

    const r = selectedReport;
    const fr = r?.full_report;

    const outcomeData = fr?.outcome_distribution
        ? Object.entries(fr.outcome_distribution).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
            value: value as number,
        }))
        : [];

    const totalOutcomes = outcomeData.reduce((s, d) => s + d.value, 0);

    if (loading) {
        return (
            <div className="page-container animate-in">
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>Loading reports...</div>
            </div>
        );
    }

    if (!r) {
        return (
            <div className="page-container animate-in">
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No reports generated yet.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container animate-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Calendar size={18} color="var(--accent)" />
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Daily Report</h2>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(r.report_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {/* Report nav */}
                    {reports.length > 1 && reports.map(rep => (
                        <button key={rep.id} onClick={() => loadReport(rep.id)}
                            style={{
                                padding: '6px 12px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer',
                                background: r.id === rep.id ? 'var(--accent)' : 'var(--bg-elevated)',
                                color: r.id === rep.id ? 'white' : 'var(--text-muted)',
                            }}>
                            {new Date(rep.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </button>
                    ))}
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '6px 12px' }}><Download size={12} /> PDF</button>
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '6px 12px' }}><Mail size={12} /> Email</button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="card-grid" style={{ marginBottom: 20 }}>
                <StatCard label="Total Chats" value={String(r.total_conversations)} icon={<MessageSquare size={16} />} color="blue" />
                <StatCard label="AI Resolved" value={r.total_conversations > 0 ? `${Math.round(r.conversations_handled / r.total_conversations * 100)}%` : '0%'} icon={<Bot size={16} />} color="green" />
                <StatCard label="Human Handoffs" value={String(r.conversations_missed)} icon={<TrendingUp size={16} />} color="orange" />
                <StatCard label="Conversion Rate" value={`${r.conversion_rate}%`} icon={<DollarSign size={16} />} color="purple" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* Conversation Outcome Donut */}
                <div className="card">
                    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Conversation Outcomes</h3>
                    {outcomeData.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ width: 130, height: 130 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" strokeWidth={0}>
                                            {outcomeData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#1c2230', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {outcomeData.map((d, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                                        <span>{d.name}</span>
                                        <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{d.value} ({totalOutcomes > 0 ? Math.round(d.value / totalOutcomes * 100) : 0}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No outcome data</div>}
                </div>

                {/* Handoff Reasons */}
                <div className="card">
                    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Handoff Reasons</h3>
                    {fr?.handoff_reasons?.map((h, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span>{h.reason}</span>
                                <span style={{ fontWeight: 700 }}>{h.pct}%</span>
                            </div>
                            <div className="progress-bar" style={{ height: 6 }}>
                                <div className="progress-fill" style={{ width: `${h.pct}%`, background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                            </div>
                        </div>
                    )) || <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No handoff data</div>}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* Voice Analysis Card */}
                <div className="card">
                    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Voice Analysis</h3>
                    {fr?.best_script && (
                        <>
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>🏆 Best Performing Script</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, padding: '8px 12px', background: 'rgba(34,197,94,0.06)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--success)' }}>
                                    "{fr.best_script.text}"
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>Win Rate: {Math.round(fr.best_script.win_rate * 100)}%</div>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>⚠️ Worst Performing Script</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, padding: '8px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--danger)' }}>
                                    "{fr.worst_script.text}"
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginTop: 4 }}>Drop-off Rate: {Math.round(fr.worst_script.dropoff_rate * 100)}%</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Top Converting Phrases & Common Objections */}
                <div className="card">
                    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Top Scripts & Objections</h3>
                    {r.top_scripts && r.top_scripts.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>💬 Top Converting Phrases</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {r.top_scripts.map((s, i) => (
                                    <span key={i} style={{ padding: '4px 12px', borderRadius: 16, fontSize: 11, background: 'rgba(59,130,246,0.12)', color: 'var(--accent)', fontWeight: 600 }}>
                                        {s.phrase} ({Math.round(s.success_rate * 100)}%)
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {r.common_objections && r.common_objections.length > 0 && (
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning)', marginBottom: 8 }}>⚡ Common Objections</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {r.common_objections.map((o, i) => (
                                    <span key={i} style={{ padding: '4px 12px', borderRadius: 16, fontSize: 11, background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', fontWeight: 600 }}>
                                        {o.phrase} ({Math.round(o.frequency * 100)}%)
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Weekly Volume Chart */}
            {fr?.weekly_volume && (
                <div className="card">
                    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Weekly Chat Volume</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={fr.weekly_volume}>
                            <XAxis dataKey="day" stroke="#4a5568" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#4a5568" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: '#1c2230', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="chats" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="resolved" fill="#22c55e" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
            </div>
        </div>
    );
}
