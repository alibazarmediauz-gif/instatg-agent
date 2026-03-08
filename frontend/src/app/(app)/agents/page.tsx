'use client';

import { useState } from 'react';
import {
    Bot, Plus, Settings, MessageSquare, Mic, Link2,
    ShieldAlert, Database, ChevronRight, Activity, Zap
} from 'lucide-react';

// Mock data to demonstrate the Unified Agent Hub
const mockAgents = [
    {
        id: '1',
        name: 'SDR Sarah',
        role: 'Outbound Sales & Qualification',
        status: 'active',
        channels: ['whatsapp', 'voice', 'telegram'],
        tools: ['amocrm_read', 'amocrm_write', 'calendar_write'],
        hitl: true // Requires human approval for some actions
    },
    {
        id: '2',
        name: 'Support_BotX',
        role: 'Technical L1 Support',
        status: 'active',
        channels: ['telegram', 'web'],
        tools: ['kb_search', 'amocrm_read', 'ticket_create'],
        hitl: false
    },
    {
        id: '3',
        name: 'Closer_Mike',
        role: 'Account Executive - Demos',
        status: 'paused',
        channels: ['voice'],
        tools: ['amocrm_read', 'amocrm_write', 'send_email'],
        hitl: true
    }
];

export default function UnifiedAgentHub() {
    const [selectedAgent, setSelectedAgent] = useState(mockAgents[0]);

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Agent Workforce Hub</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Manage unified personas, assign channels, and set tool permissions.</p>
                </div>
                <button className="btn btn-primary" style={{ gap: 8 }}>
                    <Plus size={14} /> Hire New Agent
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, flex: 1, minHeight: 0 }}>
                {/* LEFT: Agent Roster */}
                <div className="card" style={{ padding: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', position: 'sticky', top: 0 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700 }}>Active Roster ({mockAgents.filter(a => a.status === 'active').length})</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {mockAgents.map(agent => (
                            <div
                                key={agent.id}
                                onClick={() => setSelectedAgent(agent)}
                                style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--border)',
                                    cursor: 'pointer',
                                    background: selectedAgent.id === agent.id ? 'var(--bg-elevated)' : 'transparent',
                                    borderLeft: selectedAgent.id === agent.id ? '3px solid var(--accent)' : '3px solid transparent',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                                        <Bot size={16} color={agent.status === 'active' ? 'var(--accent)' : 'var(--text-muted)'} />
                                        {agent.name}
                                    </span>
                                    {agent.status === 'active' ? (
                                        <span className="status-dot animate-pulse" style={{ background: 'var(--success)' }} />
                                    ) : (
                                        <span className="status-dot" style={{ background: 'var(--text-muted)' }} />
                                    )}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{agent.role}</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {agent.channels.includes('voice') && <span className="badge neutral" title="Voice Channel"><Mic size={10} /></span>}
                                    {agent.channels.includes('telegram') && <span className="badge neutral" title="Chat Channel"><MessageSquare size={10} /></span>}
                                    {agent.hitl && <span className="badge warning" title="Requires Human Interventions"><ShieldAlert size={10} /></span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Agent Configuration */}
                <div className="card" style={{ padding: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}>
                                    <Bot size={24} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 800 }}>{selectedAgent.name}</h2>
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedAgent.role}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                <span className="badge success" style={{ padding: '4px 10px' }}>Operational</span>
                                <span className="badge outline" style={{ padding: '4px 10px', gap: 6 }}><Activity size={12} /> 98% Success</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary"><Activity size={14} style={{ marginRight: 6 }} /> View Logs</button>
                            <button className="btn btn-primary"><Settings size={14} style={{ marginRight: 6 }} /> Configure Persona</button>
                        </div>
                    </div>

                    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

                        {/* Channels Assignment */}
                        <section>
                            <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Assigned Channels</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="card" style={{ padding: '16px', border: '1px solid var(--accent)', background: 'rgba(59, 130, 246, 0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                                            <MessageSquare size={16} color="var(--accent)" /> Telegram
                                        </div>
                                        <div className="switch active" />
                                    </div>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Handling inbound text messages and responding with contextual chat capabilities.</p>
                                </div>
                                <div className="card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                                            <Mic size={16} color="var(--purple)" /> Telephony (Voice)
                                        </div>
                                        <div className="switch active" />
                                    </div>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Outbound dialing and inbound answering using ultra-realistic conversational AI.</p>
                                </div>
                            </div>
                        </section>

                        {/* Capability Matrix & Tools */}
                        <section>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capabilities & Tool Permissions</h3>
                                <button className="btn btn-sm btn-secondary" style={{ padding: '4px 12px' }}>Manage Tools</button>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11 }}>
                                        <th style={{ padding: '12px 16px' }}>Tool / Integration</th>
                                        <th style={{ padding: '12px 16px' }}>Access Level</th>
                                        <th style={{ padding: '12px 16px' }}>Human-In-The-Loop</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                                            <Database size={14} color="var(--accent)" /> amoCRM Context
                                        </td>
                                        <td style={{ padding: '16px' }}><span className="badge success">Read & Write</span></td>
                                        <td style={{ padding: '16px' }}>Auto-execute</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                                            <Zap size={14} color="var(--warning)" /> Send Proposals
                                        </td>
                                        <td style={{ padding: '16px' }}><span className="badge warning">Write Only</span></td>
                                        <td style={{ padding: '16px' }}><span className="badge danger" style={{ gap: 4 }}><ShieldAlert size={10} /> Requires Approval</span></td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-muted)' }}>
                                            <Link2 size={14} /> Schedule Meetings
                                        </td>
                                        <td style={{ padding: '16px' }}><span className="badge neutral">No Access</span></td>
                                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* Memory & Knowledge */}
                        <section style={{ border: '1px solid var(--border)', padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Memory Workspace & Playbooks</h3>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Define what this agent knows and how it operates.</p>
                                </div>
                                <ChevronRight color="var(--text-muted)" />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <span className="badge outline" style={{ padding: '6px 12px' }}>Knowledge Base: Objections 2024</span>
                                <span className="badge outline" style={{ padding: '6px 12px' }}>Playbook: Enterprise Outreach</span>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
