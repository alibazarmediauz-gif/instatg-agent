'use client';

import { useState } from 'react';
import {
    Link2, Database, Shield, Zap, Search, Key, HelpCircle, AlertTriangle, Play
} from 'lucide-react';

const mockIntegrations = [
    {
        id: 'amocrm',
        name: 'amoCRM',
        status: 'connected',
        description: 'Sync leads, update pipeline stages, and manage tasks.',
        icon: <Database size={24} color="var(--accent)" />,
        tools: [
            { id: 'get_leads', name: 'Get Leads', type: 'read', requiresApproval: false, agents: ['SDR Sarah', 'Support_BotX'] },
            { id: 'update_lead_status', name: 'Update Status', type: 'write', requiresApproval: false, agents: ['SDR Sarah'] },
            { id: 'create_task', name: 'Create Task', type: 'write', requiresApproval: false, agents: ['SDR Sarah', 'Support_BotX'] },
            { id: 'delete_lead', name: 'Delete Lead', type: 'write', requiresApproval: true, agents: [] }
        ]
    },
    {
        id: 'telegram',
        name: 'Telegram Webhooks',
        status: 'connected',
        description: 'Send and receive messages via Telegram.',
        icon: <Zap size={24} color="var(--purple)" />,
        tools: [
            { id: 'send_message', name: 'Send Message', type: 'write', requiresApproval: false, agents: ['SDR Sarah', 'Support_BotX'] },
            { id: 'send_media', name: 'Send Media', type: 'write', requiresApproval: true, agents: ['SDR Sarah'] }
        ]
    },
    {
        id: 'google_cal',
        name: 'Google Calendar',
        status: 'disconnected',
        description: 'Read availability and schedule meetings.',
        icon: <Key size={24} color="var(--text-muted)" />,
        tools: []
    }
];

export default function ToolIntegrationsManager() {
    const [selectedIntegration, setSelectedIntegration] = useState(mockIntegrations[0]);

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link2 size={28} /> Tool Integration Gateway
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage API connections and define which AI agents can execute specific tools.</p>
                </div>
                <button className="btn btn-primary" style={{ gap: 8 }}>
                    <PlusIcon size={14} /> Add Connection
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, flex: 1, minHeight: 0 }}>
                {/* LEFT: Connections List */}
                <div className="card" style={{ padding: 0, overflowY: 'auto' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', position: 'sticky', top: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search integrations..."
                                style={{
                                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                                    borderRadius: 6, padding: '8px 12px 8px 32px', color: 'var(--text-primary)', outline: 'none', fontSize: 13
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        {mockIntegrations.map(integ => (
                            <div
                                key={integ.id}
                                onClick={() => setSelectedIntegration(integ)}
                                style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    cursor: 'pointer',
                                    background: selectedIntegration.id === integ.id ? 'var(--bg-elevated)' : 'transparent',
                                    borderLeft: selectedIntegration.id === integ.id ? '3px solid var(--accent)' : '3px solid transparent'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                            {integ.icon}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700 }}>{integ.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{integ.tools.length} Tools Available</div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <span className={`badge ${integ.status === 'connected' ? 'success' : 'neutral'}`}>
                                        {integ.status === 'connected' ? 'Connected' : 'Disconnected'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Tool Permission Matrix */}
                <div className="card" style={{ padding: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                                    {selectedIntegration.icon}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 800 }}>{selectedIntegration.name} Integration</h2>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                                        {selectedIntegration.description}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn btn-secondary">Settings</button>
                                {selectedIntegration.status === 'connected' ? (
                                    <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>Disconnect</button>
                                ) : (
                                    <button className="btn btn-primary">Connect OAuth</button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Exposed Sandbox Tools</h3>
                            <button className="btn btn-sm btn-secondary" style={{ gap: 6 }}><HelpCircle size={14} /> How it works</button>
                        </div>

                        {selectedIntegration.tools.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed var(--border-subtle)' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                                    <Shield size={32} style={{ margin: '0 auto' }} />
                                </div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>No tools available</h4>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>You must connect this integration before mapping tools to your agents.</p>
                            </div>
                        ) : (
                            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                                    <thead style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                                        <tr>
                                            <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Tool Name</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Type</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>Assigned Agents</th>
                                            <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', width: 150 }}>Human-In-The-Loop</th>
                                            <th style={{ padding: '16px 20px', width: 80 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedIntegration.tools.map((tool, idx) => (
                                            <tr key={tool.id} style={{ borderBottom: idx === selectedIntegration.tools.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>
                                                    {tool.id}
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <span className={`badge ${tool.type === 'read' ? 'success' : 'warning'}`} style={{ textTransform: 'uppercase', fontSize: 10 }}>
                                                        {tool.type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    {tool.agents.length > 0 ? (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            {tool.agents.map(a => <span key={a} className="badge neutral" style={{ fontSize: 11 }}>{a}</span>)}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div className={`switch ${tool.requiresApproval ? 'active' : ''}`} style={{ background: tool.requiresApproval ? 'var(--danger)' : '' }} />
                                                        <span title="Requires Approval" style={{ display: 'flex' }}>
                                                            {tool.requiresApproval && <AlertTriangle size={14} color="var(--danger)" />}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                                    <button className="icon-btn" title="Test Tool Capability"><Play size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}

function PlusIcon({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    );
}
