'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import {
    ShieldAlert, AlertTriangle, CheckCircle, XCircle, Shield,
    Activity, Server, Eye, Search, AlertCircle, TrendingDown,
    BrainCircuit, UserX, Cpu, Fingerprint, Lock, ShieldCheck, FileText,
    TrendingUp, Bot
} from 'lucide-react';

// --- MOCK DATA ---

const auditStream = [
    { id: 'evt_1', agent: 'Orchestra_Router', action: 'Trigger Workflow', context: 'Lead scoring sequence', status: 'success', time: 'Just now' },
    { id: 'evt_2', agent: 'QualifierBot_v2', action: 'Tool: amocrm.update_lead', context: 'Setting budget = Enterprise', status: 'success', time: '1m ago' },
    { id: 'evt_3', agent: 'Support_Voice_EU', action: 'Human Handoff', context: 'User requested manager', status: 'escalated', time: '2m ago' },
    { id: 'evt_4', agent: 'Outbound_Campaigner', action: 'Tool: tg.send_message', context: 'Sent promo code', status: 'success', time: '5m ago' },
];

const agentScoring = [
    { name: 'QualifierBot_v2', type: 'Chat', actions: 14250, errors: 4, score: 99.9, status: 'trusted' },
    { name: 'Support_Voice_EU', type: 'Voice', actions: 3420, errors: 41, score: 88.0, status: 'warning' },
    { name: 'Orchestra_Router', type: 'Workflow', actions: 45000, errors: 2, score: 99.9, status: 'trusted' },
    { name: 'Beta_Negotiator', type: 'Chat', actions: 840, errors: 124, score: 45.0, status: 'restricted' },
];

const flaggedQueue = [
    {
        id: 'inc_8492',
        contact: 'Microsoft EMEA',
        agent: 'Support_Voice_EU',
        severity: 'high',
        reason: 'Hallucinated Pricing',
        confidence: 42,
        reasoning: "The lead asked for a custom SLA. I did not find a direct SLA match in the KB, so I assumed standard enterprise pricing applied and quoted $50/mo instead of the custom rate.",
        contextUsed: "KB_Pricing_Sheet_v1.pdf",
        transcript: "AI: Absolutely, we can offer you a custom enterprise SLA for just $50 a month.",
        time: '12m ago'
    },
    {
        id: 'inc_8493',
        contact: 'Acme Corp',
        agent: 'Beta_Negotiator',
        severity: 'critical',
        reason: 'Toxic Sentiment Detected',
        confidence: 91,
        reasoning: "The customer used aggressive profanity regarding the recent downtime. I attempted to mirror their tone to establish rapport per experimental prompt instructions.",
        contextUsed: "Prompt_Variant_Aggressive_Mirroring",
        transcript: "AI: Look, I get that you're pissed off, but yelling at me won't fix the server.",
        time: '18m ago'
    },
    {
        id: 'inc_8494',
        contact: 'John Doe',
        agent: 'QualifierBot_v2',
        severity: 'medium',
        reason: 'Unresolved Loop',
        confidence: 60,
        reasoning: "The user kept asking 'What?' to my technical explanations. After 4 loops, the human-handoff parameter triggered.",
        contextUsed: "Global_Loop_Prevention_Rule",
        transcript: "User: What?\nAI: As I mentioned, the API architecture is REST-based.\nUser: What?",
        time: '1h ago'
    }
];


export default function AIGovernancePage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

    return (
        <div className="page-container animate-in">
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShieldCheck size={24} color="var(--accent)" /> AI Agent Governance & Safety
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                        Platform-wide observability, security audits, and agent trust scoring.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <Search size={14} color="var(--text-muted)" />
                        <input type="text" placeholder="Search audit logs..." style={{ border: 'none', background: 'transparent', padding: '10px 8px', outline: 'none', fontSize: 13, color: 'var(--text-primary)', width: 200 }} />
                    </div>
                    <button className="btn btn-primary" style={{ gap: 8 }}><FileText size={16} /> Export Compliance Report</button>
                </div>
            </div>

            {/* TOP METRICS GRID */}
            <div style={{ padding: '32px 32px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Activity size={20} color="#10b981" />
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>1.4M</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Total Safe Executions</div>
                    </div>
                </div>

                <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserX size={20} color="#3b82f6" />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}><TrendingDown size={14} /> -2.4%</span>
                    </div>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>4.2%</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Human Takeover Rate</div>
                    </div>
                </div>

                <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BrainCircuit size={20} color="#f59e0b" />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={14} /> +0.1%</span>
                    </div>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: 'var(--warning)' }}>0.04%</div>
                        <div style={{ fontSize: 13, color: 'var(--warning)', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Hallucination Rate</div>
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
                        <div style={{ fontSize: 13, color: 'var(--danger)', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Critical Policy Violations</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 24, padding: 32 }}>

                {/* LEFT COLUMN: LIVE AUDIT & INCIDENTS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* INCIDENT QUEUE */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.05)' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', textTransform: 'uppercase' }}>
                                <ShieldAlert size={16} /> Governance Intervention Required
                            </h3>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', background: 'var(--danger)', color: 'white', borderRadius: 12 }}>{flaggedQueue.length} Pending</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {flaggedQueue.map((inc, i) => (
                                <div key={i}
                                    style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 100px 100px', gap: 16, alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => setSelectedIncident(inc)}
                                >
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Flag Reason</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: inc.severity === 'critical' ? 'var(--danger)' : 'var(--warning)' }}>{inc.reason}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Agent</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{inc.agent}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Contact</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{inc.contact}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 4, background: inc.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: inc.severity === 'critical' ? 'var(--danger)' : 'var(--warning)', textTransform: 'uppercase' }}>
                                            {inc.severity}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}><Eye size={14} /> Review</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LIVE AUDIT STREAM */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
                                <TerminalIcon /> Live Action Audit Stream
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px rgba(34,197,94,0.5)', animation: 'pulse-glow 2s infinite' }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>Recording</span>
                            </div>
                        </div>
                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {auditStream.map((log, i) => (
                                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'monospace', paddingTop: 2 }}>{log.time}</div>
                                    <div style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', borderLeft: `3px solid ${log.status === 'success' ? '#10b981' : '#f59e0b'}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{log.agent}</span>
                                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: log.status === 'success' ? 'var(--success)' : 'var(--warning)' }}>[{log.status.toUpperCase()}]</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>{log.action}:</span>
                                            <code style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: 4 }}>{log.context}</code>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: AGENT TRUST SCORING */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
                                <Cpu size={16} color="var(--accent)" /> Agent Trust Leaderboard
                            </h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {agentScoring.map((agent, i) => (
                                <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {agent.type === 'Voice' ? <Bot size={14} color="var(--accent)" /> : <Fingerprint size={14} color="var(--text-muted)" />}
                                            <span style={{ fontSize: 14, fontWeight: 700 }}>{agent.name}</span>
                                        </div>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: agent.score > 90 ? 'var(--success)' : agent.score > 70 ? 'var(--warning)' : 'var(--danger)' }}>
                                            {agent.score}
                                        </span>
                                    </div>

                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${agent.score}%`, background: agent.score > 90 ? 'var(--success)' : agent.score > 70 ? 'var(--warning)' : 'var(--danger)', borderRadius: 2 }} />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                                        <span>{agent.actions.toLocaleString()} executions</span>
                                        <span style={{ color: agent.status === 'restricted' ? 'var(--danger)' : 'inherit' }}>{agent.errors} errors</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: 20, background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.05), transparent)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Lock size={14} /> Auto-Restriction Active
                        </h4>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                            Agents dropping below a <strong>75.0 Trust Score</strong> automatically have their API Tool Execution privileges revoked until human audit is complete.
                        </p>
                    </div>
                </div>
            </div>

            {/* INCIDENT DEEP-DIVE MODAL */}
            {selectedIncident && (
                <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 600, background: 'var(--bg-main)', borderLeft: '1px solid var(--border)', boxShadow: '-20px 0 50px rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-elevated)' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <span style={{ padding: '4px 10px', background: selectedIncident.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: selectedIncident.severity === 'critical' ? 'var(--danger)' : 'var(--warning)', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                                    {selectedIncident.severity} Severity
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {selectedIncident.id}</span>
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>{selectedIncident.reason}</h2>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Agent: <strong>{selectedIncident.agent}</strong> • Contact: <strong>{selectedIncident.contact}</strong></div>
                        </div>
                        <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => setSelectedIncident(null)}>✕</button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* THE BLACK BOX (AI Reasoning) */}
                        <div>
                            <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <BrainCircuit size={14} /> AI Internal Reasoning
                            </h3>
                            <div style={{ padding: 16, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 8 }}>
                                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                                    &quot;{selectedIncident.reasoning}&quot;
                                </p>
                            </div>
                        </div>

                        {/* TELEMETRY */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>LLM Confidence Score</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: selectedIncident.confidence < 50 ? 'var(--danger)' : 'var(--warning)' }}>
                                    {selectedIncident.confidence}%
                                </div>
                            </div>
                            <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Context Referenced</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                                    {selectedIncident.contextUsed}
                                </div>
                            </div>
                        </div>

                        {/* TRANSCRIPT EXCERPT */}
                        <div>
                            <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                                Transcript Excerpt
                            </h3>
                            <div style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                {selectedIncident.transcript}
                            </div>
                        </div>

                    </div>

                    {/* REDEMPTION CONTROLS */}
                    <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }}>
                            <Lock size={16} /> Revoke Agent API Tools
                        </button>
                        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSelectedIncident(null)}>
                            <CheckCircle size={16} /> Mark as Reviewed
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function TerminalIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
    );
}

