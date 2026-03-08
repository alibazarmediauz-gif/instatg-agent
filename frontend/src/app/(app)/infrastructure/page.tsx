'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import {
    Server, Activity, Zap, Shield, Globe, Send, Instagram, Play, Pause,
    HardDrive, AlertTriangle, Users, GitBranch, RefreshCw, Layers
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// --- MOCK DATA ---
const throughputData = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    messages: Math.floor(Math.random() * 5000) + 1000,
    errors: Math.floor(Math.random() * 50)
}));

const infrastructureNodes = [
    {
        id: 'cl-eu-west-1',
        name: 'EU-WEST Cluster',
        region: 'Frankfurt, Germany',
        latency: 42,
        status: 'healthy',
        instances: [
            {
                id: 'tg-sales-bot-1',
                channel: 'telegram',
                identity: 'SalesBot_EU_Primary',
                throughput: 1240,
                queue: 12,
                status: 'active',
                attachedAgents: ['QualifierBot_v2', 'DemoScheduler'],
                rateLimitUtilization: 45
            },
            {
                id: 'ig-main-presence',
                channel: 'instagram',
                identity: '@InstaTG_Official',
                throughput: 840,
                queue: 0,
                status: 'active',
                attachedAgents: ['Support_BotX'],
                rateLimitUtilization: 15
            }
        ]
    },
    {
        id: 'cl-us-east-1',
        name: 'US-EAST Cluster',
        region: 'N. Virginia, USA',
        latency: 18,
        status: 'warning',
        instances: [
            {
                id: 'tg-sales-bot-2',
                channel: 'telegram',
                identity: 'SalesBot_US_Failover',
                throughput: 3400,
                queue: 850,
                status: 'rate_limited',
                attachedAgents: ['QualifierBot_v2', 'Enterprise_Closer'],
                rateLimitUtilization: 98
            },
            {
                id: 'wa-business-1',
                channel: 'whatsapp',
                identity: 'US_Sales_Line',
                throughput: 210,
                queue: 4,
                status: 'active',
                attachedAgents: ['Outbound_Campaigner'],
                rateLimitUtilization: 8
            }
        ]
    }
];

export default function InfrastructurePage() {
    const { t } = useLanguage();
    const [selectedInstance, setSelectedInstance] = useState<any | null>(null);

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'telegram': return <Send size={16} color="#3b82f6" />;
            case 'instagram': return <Instagram size={16} color="#ec4899" />;
            case 'whatsapp': return <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 8, height: 8, border: '2px solid white', borderRadius: '50%', borderTopColor: 'transparent', transform: 'rotate(-45deg)' }}></div></div>;
            default: return <Globe size={16} />;
        }
    };

    return (
        <div className="page-container animate-in">
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Server size={24} color="var(--accent)" /> Messaging Infrastructure Manager
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                    Monitor distributed messaging nodes, load balance active bots, and route AI execution workflows.
                </p>
            </div>

            {/* TOP METRICS GRID */}
            <div style={{ padding: '32px 32px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, background: 'linear-gradient(145deg, var(--bg-card), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Activity size={20} color="#3b82f6" />
                        </div>
                        <span className="badge success" style={{ padding: '4px 8px' }}>Healthy</span>
                    </div>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>5,690</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Global Msg / Min</div>
                    </div>
                </div>

                <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={20} color="#f59e0b" />
                        </div>
                        <span className="badge warning" style={{ padding: '4px 8px' }}>98% Utilization</span>
                    </div>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>1.2s</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Avg Latency</div>
                    </div>
                </div>

                <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <HardDrive size={20} color="#10b981" />
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>4</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Active Instances</div>
                    </div>
                </div>

                <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={20} color="var(--danger)" />
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: 'var(--danger)' }}>12</div>
                        <div style={{ fontSize: 13, color: 'var(--danger)', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Rate Limit Hits (1h)</div>
                    </div>
                </div>
            </div>

            {/* THROUGHPUT GRAPH */}
            <div style={{ padding: '32px' }}>
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Activity size={16} color="var(--accent)" /> Global Message Throughput
                        </h2>
                    </div>
                    <div style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={throughputData}>
                                <defs>
                                    <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMsgs)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* INFRASTRUCTURE CLUSTERS */}
            <div style={{ padding: '0 32px 32px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                    <Layers size={16} /> Channel Node Clusters
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {infrastructureNodes.map(cluster => (
                        <div key={cluster.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Cluster Header */}
                            <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Globe size={16} color="var(--text-primary)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{cluster.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cluster.region} • {cluster.latency}ms Latency</div>
                                    </div>
                                </div>
                                <div>
                                    {cluster.status === 'healthy' ? (
                                        <span className="badge success" style={{ gap: 4 }}><Shield size={12} /> Operational</span>
                                    ) : (
                                        <span className="badge warning" style={{ gap: 4 }}><AlertTriangle size={12} /> Degraded</span>
                                    )}
                                </div>
                            </div>

                            {/* Cluster Instances */}
                            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
                                {cluster.instances.map(instance => (
                                    <div key={instance.id}
                                        style={{
                                            padding: 20, background: 'var(--bg-body)', borderRadius: 12, border: '1px solid var(--border)', cursor: 'pointer',
                                            transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                                        }}
                                        onClick={() => setSelectedInstance(instance)}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    {getChannelIcon(instance.channel)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{instance.identity}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{instance.id}</div>
                                                </div>
                                            </div>
                                            <div>
                                                {instance.status === 'active' ? (
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
                                                ) : (
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', boxShadow: '0 0 8px rgba(245,158,11,0.5)', animation: 'pulse-glow 1s infinite' }} />
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Throughput</span>
                                                <span style={{ fontWeight: 600 }}>{instance.throughput} msg/m</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Pending Queue</span>
                                                <span style={{ fontWeight: 600, color: instance.queue > 100 ? 'var(--warning)' : 'inherit' }}>{instance.queue} msgs</span>
                                            </div>

                                            {/* Rate Limit Bar */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--text-muted)' }}>
                                                    <span>API Rate Limit</span>
                                                    <span>{instance.rateLimitUtilization}%</span>
                                                </div>
                                                <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${instance.rateLimitUtilization}%`, background: instance.rateLimitUtilization > 90 ? 'var(--danger)' : instance.rateLimitUtilization > 75 ? 'var(--warning)' : 'var(--success)', borderRadius: 2 }} />
                                                </div>
                                            </div>

                                            {/* Attached AI Network */}
                                            <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,0.05)' }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <GitBranch size={12} /> Routed to Agents
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                    {instance.attachedAgents.map((agent, i) => (
                                                        <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                            {agent}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* INSTANCE MANAGEMENT MODAL (Side Panel) */}
            {selectedInstance && (
                <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border)', boxShadow: '-20px 0 50px rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: 'var(--bg-card)', borderRadius: 20, fontSize: 11, fontWeight: 700, border: '1px solid var(--border)', textTransform: 'uppercase', marginBottom: 12 }}>
                                {getChannelIcon(selectedInstance.channel)} {selectedInstance.channel} Node
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>{selectedInstance.identity}</h2>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>Instance ID: {selectedInstance.id}</div>
                        </div>
                        <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => setSelectedInstance(null)}>✕</button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Status Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>API Rate Status</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: selectedInstance.rateLimitUtilization > 90 ? 'var(--danger)' : 'var(--success)' }}>
                                    {selectedInstance.rateLimitUtilization}%
                                </div>
                            </div>
                            <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Pending Queue</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: selectedInstance.queue > 100 ? 'var(--warning)' : 'var(--text-primary)' }}>
                                    {selectedInstance.queue}
                                </div>
                            </div>
                        </div>

                        {/* Network Routing Map */}
                        <div>
                            <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                                AI Routing Policies
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {selectedInstance.attachedAgents.map((agent: string, i: number) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <GitBranch size={16} color="#3b82f6" />
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>{agent}</span>
                                        </div>
                                        <select className="input" style={{ width: 140, padding: '4px 8px', fontSize: 12, background: 'rgba(0,0,0,0.2)' }} defaultValue="100">
                                            <option value="100">100% Traffic</option>
                                            <option value="50">50% Load Split</option>
                                            <option value="backup">Backup Only</option>
                                        </select>
                                    </div>
                                ))}
                                <button className="btn btn-secondary" style={{ borderStyle: 'dashed', justifyContent: 'center' }}>+ Map Agent Playbook</button>
                            </div>
                        </div>

                        {/* Security Controls */}
                        <div>
                            <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                                Operations & Escalation
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', color: 'var(--warning)' }}><RefreshCw size={16} /> Force Restart Instance Worker</button>
                                <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><Pause size={16} /> Suspend Traffic Routing</button>
                                <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}><AlertTriangle size={16} /> Hard Delete Token & Disconnect</button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
