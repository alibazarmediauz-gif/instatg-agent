'use client';

import { useState } from 'react';
import {
    Network, Search, Filter, Phone, Mail, Building,
    MessageSquare, Clock, Zap, Target, ArrowRight, ShieldAlert, Edit3
} from 'lucide-react';
import AgentActionPanel, { ActionStatus } from '@/components/AgentActionPanel';

// Mock CRM Leads
const mockLeads = [
    { id: '1', name: 'John Doe', company: 'Acme Corp', stage: 'Negotiation', score: 85, phone: '+1 555-0192' },
    { id: '2', name: 'Sarah Jenkins', company: 'TechFlow', stage: 'Qualification', score: 42, phone: '+1 555-9012' },
    { id: '3', name: 'Mike Ross', company: 'Pearson Specter', stage: 'Closed Won', score: 99, phone: '+1 555-8821' }
];

export default function AINativeCRM() {
    const [selectedLead, setSelectedLead] = useState(mockLeads[0]);

    // Mock timeline combining standard events + deep AI Actions
    const agentTimeline = [
        {
            type: 'agent_action',
            id: 'act1',
            agentName: 'SDR_Sarah',
            timestamp: 'Just now',
            reasoning: 'Lead asked for a discount. I need human approval to send the custom enterprise pricing structure.',
            toolName: 'amocrm.draft_proposal',
            toolPayload: { discount_tier: 'enterprise_custom', target: 'John Doe' },
            status: 'requires_action' as ActionStatus,
            nextActionPredicted: 'If approved, email proposal and schedule follow-up task 3 days from now.',
            businessImpact: 'Potential Deal Value: $1,000 MRR. Moves deal to "Proposal Sent".'
        },
        {
            type: 'standard_event',
            id: 'evt1',
            icon: <Zap size={14} color="var(--accent)" />,
            title: 'Lead Score increased to 85',
            desc: 'Triggered by high engagement with technical documentation link.',
            time: '2 hours ago'
        },
        {
            type: 'agent_action',
            id: 'act2',
            agentName: 'Support_BotX',
            timestamp: '3 hours ago',
            reasoning: 'Lead asked a technical question about API limits. I queried the vector DB and provided the answer.',
            toolName: 'kb.search',
            toolPayload: { query: 'enterprise API rate limits concurrency' },
            toolResult: { answer_found: true, article_id: 'kb_891' },
            status: 'success' as ActionStatus,
            businessImpact: 'Maintained engagement, prevented human support ticket creation.'
        },
        {
            type: 'standard_event',
            id: 'evt2',
            icon: <MessageSquare size={14} color="var(--purple)" />,
            title: 'Inbound Telegram Message',
            desc: '"Can you guys handle 500 requests per second?"',
            time: '3 hours ago'
        }
    ];

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Network size={28} color="var(--accent)" /> AI-Native CRM View
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Bi-directional sync with granular agent observability and execution timeline.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" style={{ gap: 8 }}><Filter size={14} /> Pipeline View</button>
                    <button className="btn btn-primary" style={{ gap: 8 }}><Zap size={14} /> Force AI Sync</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, flex: 1, minHeight: 0 }}>
                {/* LEFT: Leads List */}
                <div className="card" style={{ padding: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', position: 'sticky', top: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                style={{
                                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                                    borderRadius: 6, padding: '8px 12px 8px 32px', color: 'var(--text-primary)', outline: 'none', fontSize: 13
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        {mockLeads.map(lead => (
                            <div
                                key={lead.id}
                                onClick={() => setSelectedLead(lead)}
                                style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    cursor: 'pointer',
                                    background: selectedLead.id === lead.id ? 'var(--bg-elevated)' : 'transparent',
                                    borderLeft: selectedLead.id === lead.id ? '3px solid var(--accent)' : '3px solid transparent'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{lead.name}</div>
                                    {lead.score > 80 && <span className="badge success" style={{ fontSize: 10, padding: '2px 6px' }}>Hot</span>}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Building size={12} /> {lead.company}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>
                                    {lead.stage}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Deep Lead Intelligence & Action Timeline */}
                <div className="card" style={{ padding: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)' }}>

                    {/* Header Profile */}
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{selectedLead.name}</h2>
                                <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', fontSize: 13 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building size={14} /> {selectedLead.company}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} /> {selectedLead.phone}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontWeight: 600 }}><Target size={14} color="var(--accent)" /> Score: {selectedLead.score}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn btn-secondary" style={{ gap: 8 }}><Edit3 size={14} /> Edit Data</button>
                                <button className="btn btn-primary" style={{ gap: 8 }}><MessageSquare size={14} /> Takeover Chat</button>
                            </div>
                        </div>

                        {/* AI Intelligence Summary Block */}
                        <div style={{ marginTop: 24, padding: 20, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Zap size={14} /> AI Context Summary
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                                Lead is highly technical and concerned about API scaling. <b>Support_BotX</b> successfully answered their concurrency questions, increasing lead score to 85. <b>SDR_Sarah</b> has deduced buying intent and is currently blocked waiting for approval on a custom Enterprise quote.
                            </p>
                        </div>
                    </div>

                    {/* Timeline Feed */}
                    <div style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24 }}>Execution Timeline</h3>

                        <div style={{ position: 'relative' }}>
                            {/* Vertical Line */}
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 16, width: 2, background: 'var(--border)' }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {agentTimeline.map((item, idx) => (
                                    <div key={item.id} style={{ display: 'flex', gap: 24, position: 'relative' }}>
                                        {item.type === 'agent_action' ? (
                                            <>
                                                {/* Agent Action Node */}
                                                <div style={{ position: 'relative', zIndex: 1, marginTop: 16 }}>
                                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: (item.status === 'requires_action') ? 'var(--warning)' : 'var(--accent)', outline: '4px solid var(--bg-elevated)', marginLeft: 11 }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <AgentActionPanel
                                                        id={item.id}
                                                        agentName={item.agentName!}
                                                        timestamp={item.timestamp!}
                                                        reasoning={item.reasoning!}
                                                        toolName={item.toolName!}
                                                        toolPayload={item.toolPayload!}
                                                        toolResult={item.toolResult}
                                                        status={item.status as ActionStatus}
                                                        nextActionPredicted={item.nextActionPredicted}
                                                        businessImpact={item.businessImpact}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* Standard CRM Event Node */}
                                                <div style={{ position: 'relative', zIndex: 1, marginTop: 4 }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {item.icon}
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1, padding: '8px 0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{item.title}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.time}</div>
                                                    </div>
                                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.desc}</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
