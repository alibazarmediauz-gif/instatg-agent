'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { useLanguage } from '@/lib/LanguageContext';
import {
    Activity, ShieldAlert, Cpu, Network, CheckCircle2,
    Clock, AlertTriangle, Bot, Zap, PlayCircle, BarChart,
    Instagram, MessageSquare, Database, Phone, ArrowRight
} from 'lucide-react';
import AgentActionPanel, { ActionStatus } from '@/components/AgentActionPanel';
import { getAnalyticsDashboard, apiClient } from '@/lib/api';

export default function ControlCenter() {
    const { tenantId } = useTenant();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);

    // Simulated real-time execution feed mapping to the 7-Question Framework
    const [executionLogs, setExecutionLogs] = useState([
        {
            id: 'log1',
            agentName: 'SDR_Sarah',
            timestamp: 'Just now',
            reasoning: 'Gathering context on lead Acme Corp to personalize the outbound pitch.',
            toolName: 'amocrm.lookup_lead',
            toolPayload: { lead_id: 402 },
            toolResult: { name: 'John Doe', stage: 'Prospect' },
            status: 'success' as ActionStatus,
            businessImpact: 'Context acquired for high-conversion pitching.'
        },
        {
            id: 'log2',
            agentName: 'SDR_Sarah',
            timestamp: '1 min ago',
            reasoning: 'Lead requested enterprise pricing. Generating draft.',
            toolName: 'internal.draft_proposal',
            toolPayload: { type: 'enterprise', target: 'John Doe' },
            status: 'executing' as ActionStatus,
            nextActionPredicted: 'Will pause and send to HITL Action Queue for manager approval.'
        },
        {
            id: 'log3',
            agentName: 'Support_BotX',
            timestamp: '3 mins ago',
            reasoning: 'Finished resolving the API rate limit ticket.',
            toolName: 'zendesk.update_ticket',
            toolPayload: { ticket_id: 89, status: 'resolved' },
            status: 'success' as ActionStatus,
            businessImpact: 'Ticket resolved automatically. Saved 15m of human agent time.'
        }
    ]);

    const [integrations, setIntegrations] = useState({
        telegram: true,
        instagram: true,
        amocrm: false,
        telephony: false
    });

    const fetchDashboard = async () => {
        try {
            const data = await apiClient<any>('/api/integrations/crm-status');
            setIntegrations(prev => ({
                ...prev,
                amocrm: data.connected || false
            }));

            // Check for voice agents to set telephony status
            const voiceData = await apiClient<any>('/api/agents/voice');
            setIntegrations(prev => ({
                ...prev,
                telephony: (voiceData.data && voiceData.data.length > 0)
            }));

        } catch (error) {
            console.error('Dashboard sync failed:', error);
        } finally {
            setLoading(false);
        }
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

            {/* ─── Integrated Setup Wizard (Main Screen Prominence) ─── */}
            <div className="card" style={{ marginBottom: 32, padding: 24, background: 'var(--gradient-premium)', border: 'none', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: -50, top: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Zap size={24} fill="white" /> Activate Your AI Sales Department
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Connect your channels to start automating sales conversations and lead capture.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <QuickLink ch="Telegram" ok={integrations.telegram} icon={<MessageSquare size={14} />} />
                        <QuickLink ch="Instagram" ok={integrations.instagram} icon={<Instagram size={14} />} />
                        <QuickLink ch="amoCRM" ok={integrations.amocrm} icon={<Database size={14} />} />
                        <QuickLink ch="Telephony" ok={integrations.telephony} icon={<Phone size={14} />} />
                    </div>
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
                    <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {executionLogs.map((log) => (
                            <AgentActionPanel
                                key={log.id}
                                id={log.id}
                                agentName={log.agentName}
                                timestamp={log.timestamp}
                                reasoning={log.reasoning}
                                toolName={log.toolName}
                                toolPayload={log.toolPayload}
                                toolResult={log.toolResult}
                                status={log.status}
                                nextActionPredicted={log.nextActionPredicted}
                                businessImpact={log.businessImpact}
                            />
                        ))}
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

function QuickLink({ ch, ok, icon }: { ch: string, ok: boolean, icon: any }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '8px 16px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            border: ok ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(255,255,255,0.1)',
            minWidth: 140
        }}>
            <div style={{ color: ok ? '#34d399' : 'white' }}>{icon}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'white', lineHeight: 1 }}>{ch}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: ok ? '#34d399' : 'rgba(255,255,255,0.5)', marginTop: 2 }}>{ok ? 'CONNECTED' : 'OFFLINE'}</div>
            </div>
            {!ok && <ArrowRight size={12} color="white" />}
        </div>
    );
}
