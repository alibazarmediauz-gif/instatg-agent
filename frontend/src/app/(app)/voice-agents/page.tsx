'use client';

import { useState } from 'react';
import {
    PhoneCall, Activity, HeartPulse, BrainCircuit, Mic, PhoneOff, UserCheck, PlayCircle, BarChart3, Users, Volume2, ShieldAlert,
    Target, Building, ArrowRight, Zap, Play, Settings
} from 'lucide-react';
import AgentActionPanel, { ActionStatus } from '@/components/AgentActionPanel';

// Mock active calls
const mockLiveCalls = [
    {
        id: 'call-1',
        agent: 'SDR_Sarah_Voice',
        leadName: 'Emma Watson',
        company: 'CloudSync Inc',
        duration: '02:14',
        intent: 'Pricing Inquiry',
        sentiment: 'Positive',
        status: 'active'
    },
    {
        id: 'call-2',
        agent: 'Support_BotX_Voice',
        leadName: 'James Hold',
        company: 'Logistics LLC',
        duration: '05:42',
        intent: 'Technical Support',
        sentiment: 'Frustrated',
        status: 'escalation_risk'
    }
];

// Mock intelligence panel for a specific call
const mockCallIntelligence = {
    contact: { name: 'Emma Watson', company: 'CloudSync Inc', phone: '+1 (555) 019-2831', score: 85 },
    transcript: [
        { speaker: 'ai', text: 'Hi, this is Sarah from SalesAI. Am I speaking with Emma?' },
        { speaker: 'user', text: 'Yes, hi Sarah. I was looking at your enterprise plans.' },
        { speaker: 'ai', text: 'Great! To give you the best quote, roughly how many API calls are you doing monthly right now?' },
        { speaker: 'user', text: 'Uh, we are currently doing around 2 million a month, but we expect to double that soon.' }
    ],
    agentActions: [
        {
            id: 'act1',
            agentName: 'SDR_Sarah_Voice',
            timestamp: '15s ago',
            reasoning: 'The prospect indicated 2M monthly volume. I need to calculate the enterprise tier pricing and draft a quote to CRM before quoting it aloud.',
            toolName: 'amocrm.draft_proposal',
            toolPayload: { volume: 2000000, target: 'Emma Watson' },
            toolResult: { amount: '$4,000/mo', plan: 'Enterprise Custom' },
            status: 'success' as ActionStatus,
            businessImpact: 'Pricing matched to customer segment.'
        },
        {
            id: 'act2',
            agentName: 'SDR_Sarah_Voice',
            timestamp: 'Just now',
            reasoning: 'Ready to present the $4k quote out loud over the call.',
            toolName: 'voice.synthesize',
            toolPayload: { text: "Based on 2 million calls, we can start you on our Enterprise Custom plan for $4,000 a month. How does that sound?" },
            status: 'executing' as ActionStatus,
            nextActionPredicted: 'Listen for objection. If price too high, invoke tool: check_discount_authority().'
        }
    ]
};

export default function VoiceAgentsOperations() {
    const [activeTab, setActiveTab] = useState<'operations' | 'workforce'>('operations');
    const [selectedCall, setSelectedCall] = useState<any>(null);

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Mic size={28} color="var(--purple)" /> AI Voice Sales Control Center
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Real-time operations, human takeover, and deep observability of autonomous voice interactions.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <button
                        className={`btn ${activeTab === 'operations' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('operations')}
                    >
                        Live Operations
                    </button>
                    <button
                        className={`btn ${activeTab === 'workforce' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('workforce')}
                    >
                        Agent Workforce & Campaigns
                    </button>
                </div>
            </div>

            {activeTab === 'operations' && !selectedCall && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>

                    {/* Top KPI Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                        <KPICard title="Live AI Calls" value={mockLiveCalls.length} icon={<PhoneCall size={16} />} color="var(--success)" pulse />
                        <KPICard title="AI Actions Executed" value="342" sub="Today (During Calls)" icon={<PlayCircle size={16} />} color="var(--purple)" />
                        <KPICard title="Human Takeovers" value="4.2%" sub="Escalation Rate" icon={<ShieldAlert size={16} />} color="var(--warning)" />
                        <KPICard title="Meeting Booking" value="18%" sub="Conversion Rate" icon={<Target size={16} />} color="var(--accent)" />
                        <KPICard title="Audio Latency" value="~620ms" sub="Global Average" icon={<Activity size={16} />} color="var(--text-muted)" />
                    </div>

                    {/* Live Operations Grid */}
                    <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Volume2 size={16} color="var(--success)" /> Live Voice Execution Map
                            </h3>
                        </div>
                        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, overflowY: 'auto' }}>
                            {mockLiveCalls.map(call => (
                                <div
                                    key={call.id}
                                    className="card"
                                    style={{
                                        padding: 20, cursor: 'pointer', transition: 'transform 0.2s',
                                        border: call.status === 'escalation_risk' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)',
                                        background: call.status === 'escalation_risk' ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card)'
                                    }}
                                    onClick={() => setSelectedCall(mockCallIntelligence)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="status-dot animate-pulse" style={{ background: call.status === 'escalation_risk' ? 'var(--danger)' : 'var(--success)' }} />
                                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{call.duration}</span>
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: call.status === 'escalation_risk' ? 'var(--danger)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            {call.status === 'escalation_risk' ? 'Escalation Risk' : 'Autonomous'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 12, marginBottom: 16 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', paddingTop: 8 }}>
                                            <Mic size={20} color="var(--accent)" style={{ margin: '0 auto' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>{call.agent}</div>
                                            <div style={{ fontSize: 15, fontWeight: 700 }}>{call.leadName}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{call.company}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        <span className="badge info" style={{ fontSize: 10 }}>Intent: {call.intent}</span>
                                        <span className={`badge ${call.sentiment === 'Positive' ? 'success' : 'danger'}`} style={{ fontSize: 10 }}>{call.sentiment}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'operations' && selectedCall && (
                <div style={{ flex: 1, display: 'flex', gap: 24, minHeight: 0 }}>

                    {/* LEFT: Live Call Transcript & Human Controls */}
                    <div className="card" style={{ flex: '0 0 450px', padding: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button className="icon-btn" onClick={() => setSelectedCall(null)}>←</button>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>Live Audio & Transcript</div>
                                    <div style={{ fontSize: 11, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div className="status-dot animate-pulse" style={{ background: 'var(--success)' }} /> Connected (02:14)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transcript Area */}
                        <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {selectedCall.transcript.map((msg: any, i: number) => (
                                <div key={i} style={{ display: 'flex', gap: 12, flexDirection: msg.speaker === 'user' ? 'row-reverse' : 'row' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.speaker === 'ai' ? 'var(--purple)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {msg.speaker === 'ai' ? <BrainCircuit size={14} color="white" /> : <UserCheck size={14} />}
                                    </div>
                                    <div style={{
                                        maxWidth: '75%', padding: '10px 14px', borderRadius: 12, fontSize: 13,
                                        background: msg.speaker === 'ai' ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-card)',
                                        border: msg.speaker === 'ai' ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                        borderTopLeftRadius: msg.speaker === 'ai' ? 0 : 12,
                                        borderTopRightRadius: msg.speaker === 'user' ? 0 : 12,
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {/* AI Generating Indicator */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BrainCircuit size={14} color="white" />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px', borderRadius: 12, background: 'rgba(168, 85, 247, 0.1)' }}>
                                    <span style={{ fontSize: 12, color: 'var(--purple)', fontStyle: 'italic', marginRight: 8 }}>Thinking & Acting...</span>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--purple)', animation: 'pulse 1s infinite' }} />
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--purple)', animation: 'pulse 1s infinite 0.2s' }} />
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--purple)', animation: 'pulse 1s infinite 0.4s' }} />
                                </div>
                            </div>
                        </div>

                        {/* Human Takeover Controls */}
                        <div style={{ padding: 20, borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Human Intervention Panel</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input type="text" className="input" placeholder="Type a hidden cue for the AI..." style={{ width: '100%', fontSize: 13 }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <button className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', gap: 8 }}><PhoneOff size={14} /> End Call</button>
                                    <button className="btn btn-primary" style={{ gap: 8, background: 'var(--warning)', color: '#000' }}><Headset size={14} /> Take Over Call</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Real-Time Call Intelligence & Execution Panel */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', paddingRight: 8 }}>

                        {/* Context Header */}
                        <div className="card" style={{ padding: 24, background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                                    {selectedCall.contact.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 18, fontWeight: 800 }}>{selectedCall.contact.name}</h2>
                                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building size={12} /> {selectedCall.contact.company}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><PhoneCall size={12} /> {selectedCall.contact.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CRM Lead Score</div>
                                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)' }}>{selectedCall.contact.score}</div>
                            </div>
                        </div>

                        {/* Action Execution Feed */}
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Zap size={16} color="var(--accent)" /> Real-Time Artificial Intelligence Feed
                            </h3>

                            <div style={{ position: 'relative' }}>
                                {/* Timeline Line */}
                                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 16, width: 2, background: 'var(--border)' }} />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    {selectedCall.agentActions.map((item: any) => (
                                        <div key={item.id} style={{ display: 'flex', gap: 24, position: 'relative' }}>
                                            <div style={{ position: 'relative', zIndex: 1, marginTop: 16 }}>
                                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.status === 'executing' ? 'var(--accent)' : 'var(--text-muted)', outline: '4px solid var(--bg)', marginLeft: 11 }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <AgentActionPanel
                                                    id={item.id}
                                                    agentName={item.agentName}
                                                    timestamp={item.timestamp}
                                                    reasoning={item.reasoning}
                                                    toolName={item.toolName}
                                                    toolPayload={item.toolPayload}
                                                    toolResult={item.toolResult}
                                                    status={item.status as ActionStatus}
                                                    nextActionPredicted={item.nextActionPredicted}
                                                    businessImpact={item.businessImpact}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'workforce' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                        <Users size={48} style={{ margin: '0 auto 16px', color: 'var(--border)' }} />
                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Agent Hub Integration Required</div>
                        <div style={{ fontSize: 14, maxWidth: 400 }}>
                            Voice agent training, personality configuration, script adherence, and campaign scheduling are now managed centrally in the <a href="/agents" style={{ color: 'var(--accent)' }}>Unified Agent Hub</a>.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function KPICard({ title, value, sub, icon, color, pulse = false }: any) {
    return (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: `4px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{title}</span>
                <div style={{ color, display: 'flex', alignItems: 'center' }}>
                    {pulse && <div className="status-dot animate-pulse" style={{ background: color, marginRight: 6 }} />}
                    {icon}
                </div>
            </div>
            <div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontWeight: 600 }}>{sub}</div>
            </div>
        </div>
    );
}
