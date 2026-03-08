'use client';

import { useState } from 'react';
import { ShieldAlert, User, Building, Clock, Search, CheckCircle2, X } from 'lucide-react';
import AgentActionPanel, { ActionStatus } from '@/components/AgentActionPanel';

const mockQueue = [
    {
        id: 'q1',
        agentName: 'SDR_Sarah',
        timestamp: '2 mins ago',
        leadName: 'John Doe',
        company: 'Acme Corp',
        reasoning: 'The lead asked for custom enterprise pricing based on their usage of 50k API calls. I drafted a proposal using our standard tiered discount.',
        toolName: 'amocrm.send_email',
        toolPayload: {
            to: 'john@acmecorp.com',
            subject: 'SalesAI Enterprise Proposal',
            body: 'Hi John,\n\nBased on your volume of 50k calls, we can offer our Enterprise tier at $0.02/call.\n\nLet me know if you would like me to send the contract.\n\nBest,\nSarah (AI)'
        },
        status: 'requires_action' as ActionStatus,
        nextActionPredicted: 'Wait 2 days for reply. If no response, invoke tool: amocrm.create_task("Follow up on custom quote").',
        businessImpact: 'Moves deal stage to "Proposal Sent". Expected MRR: $1,000.'
    },
    {
        id: 'q2',
        agentName: 'Support_BotX',
        timestamp: '15 mins ago',
        leadName: 'Sarah Jenkins',
        company: 'TechFlow',
        reasoning: 'User requested account deletion. Due to our retention policy, this is a high-risk action requiring manual admin approval.',
        toolName: 'billing.delete_workspace',
        toolPayload: {
            workspace_id: 'techflow-1290',
            reason: 'User request via Telegram support channel'
        },
        status: 'requires_action' as ActionStatus
    }
];

export default function ActionQueue() {
    const [queue, setQueue] = useState(mockQueue);
    const [selectedItem, setSelectedItem] = useState(mockQueue[0]);

    const handleApprove = (id: string) => {
        setQueue(q => q.filter(i => i.id !== id));
        if (selectedItem?.id === id) {
            setSelectedItem(null as any);
        }
    };

    const handleOverride = (id: string, newPayload: object) => {
        console.log("Saving new payload:", newPayload);
        handleApprove(id);
    };

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ShieldAlert size={28} color="var(--warning)" /> Human Review & Approval
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Triage inbox for pending AI actions that require manual confirmation.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="badge warning" style={{ padding: '8px 16px', fontSize: 13, gap: 8 }}>
                        <Clock size={14} /> {queue.length} Pending Approval
                    </div>
                </div>
            </div>

            {/* UX Explainer Banner */}
            <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                    <ShieldAlert size={20} />
                </div>
                <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>What is this page?</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>This is your **Safety Inbox**. When an AI agent wants to take a high-risk action (like sending a custom quote or deleting data), it stops and waits here for your approval.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, flex: 1, minHeight: 0 }}>
                {/* LEFT: Inbox Column */}
                <div className="card" style={{ padding: 0, overflowY: 'auto' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', position: 'sticky', top: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search pending actions..."
                                style={{
                                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                                    borderRadius: 6, padding: '8px 12px 8px 32px', color: 'var(--text-primary)', outline: 'none', fontSize: 13
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        {queue.length === 0 ? (
                            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                                <CheckCircle2 size={32} style={{ margin: '0 auto 12px', color: 'var(--success)' }} />
                                <div style={{ fontSize: 14, fontWeight: 700 }}>Inbox Zero</div>
                                <div style={{ fontSize: 12 }}>All AI actions have been triaged.</div>
                            </div>
                        ) : queue.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    cursor: 'pointer',
                                    background: selectedItem?.id === item.id ? 'var(--bg-elevated)' : 'transparent',
                                    borderLeft: selectedItem?.id === item.id ? '3px solid var(--accent)' : '3px solid transparent'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.agentName}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.timestamp}</div>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {item.reasoning}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <span className="badge warning" style={{ fontSize: 10 }}>Requires Approval</span>
                                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--purple)', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: 4 }}>
                                        {item.toolName}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Detail View */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', paddingRight: 8 }}>
                    {selectedItem ? (
                        <>
                            {/* Context Card */}
                            <div className="card" style={{ padding: '24px 32px', background: 'var(--bg-elevated)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h2 style={{ fontSize: 16, fontWeight: 800 }}>Lead Context</h2>
                                    <button className="btn btn-sm btn-secondary">Open in CRM</button>
                                </div>
                                <div style={{ display: 'flex', gap: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white' }}>
                                            {selectedItem.leadName.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedItem.leadName}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Building size={12} /> {selectedItem.company}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24, flex: 1 }}>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Interaction Summary</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Lead engaged via Telegram 20 mins ago. Asked 3 technical questions, then requested pricing for high volume usage.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Panel */}
                            <div>
                                <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Proposed AI Action</h2>
                                <AgentActionPanel
                                    id={selectedItem.id}
                                    agentName={selectedItem.agentName}
                                    timestamp={selectedItem.timestamp}
                                    reasoning={selectedItem.reasoning}
                                    toolName={selectedItem.toolName}
                                    toolPayload={selectedItem.toolPayload}
                                    status={selectedItem.status}
                                    nextActionPredicted={(selectedItem as any).nextActionPredicted}
                                    businessImpact={(selectedItem as any).businessImpact}
                                    onOverride={handleOverride}
                                    onApprove={handleApprove}
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                                    <button onClick={() => handleApprove(selectedItem.id)} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', gap: 6 }}>
                                        <X size={14} /> Reject & Add Feedback
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            Select an item from the queue to review.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
