'use client';

import { useState } from 'react';
import {
    CheckCircle2, AlertTriangle, AlertCircle, Bot, Zap,
    TerminalSquare, RotateCcw, Edit3, X, Play
} from 'lucide-react';

export type ActionStatus = 'pending' | 'executing' | 'success' | 'failed' | 'requires_action';

export interface AgentActionProps {
    id: string;
    agentName: string;
    timestamp: string;
    reasoning: string;
    toolName: string;
    toolPayload: object;
    toolResult?: object;
    status: ActionStatus;
    onRetry?: (id: string) => void;
    onOverride?: (id: string, newPayload: object) => void;
    onApprove?: (id: string) => void;
}

export default function AgentActionPanel({
    id,
    agentName,
    timestamp,
    reasoning,
    toolName,
    toolPayload,
    toolResult,
    status,
    onRetry,
    onOverride,
    onApprove
}: AgentActionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedPayload, setEditedPayload] = useState(JSON.stringify(toolPayload, null, 2));

    const statusConfig = {
        success: { color: 'var(--success)', icon: <CheckCircle2 size={16} />, label: 'Executed Successfully' },
        failed: { color: 'var(--danger)', icon: <AlertCircle size={16} />, label: 'Execution Failed' },
        executing: { color: 'var(--accent)', icon: <Zap size={16} className="animate-pulse" />, label: 'Executing in background' },
        pending: { color: 'var(--text-muted)', icon: <TerminalSquare size={16} />, label: 'Planned Action' },
        requires_action: { color: 'var(--warning)', icon: <AlertTriangle size={16} />, label: 'Requires Human Approval' },
    };

    const config = statusConfig[status];

    const toggleExpand = () => {
        if (!isEditing) setIsExpanded(!isExpanded);
    };

    return (
        <div style={{
            background: 'var(--bg-elevated)',
            border: `1px solid ${status === 'requires_action' ? 'rgba(245, 158, 11, 0.4)' : 'var(--border)'}`,
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 16
        }}>
            {/* Header / Summary row */}
            <div
                style={{
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: status === 'requires_action' ? 'rgba(245, 158, 11, 0.05)' : 'transparent'
                }}
                onClick={toggleExpand}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Bot size={14} color="var(--accent)" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{agentName}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timestamp}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                        "{reasoning}"
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{
                            fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                            background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4,
                            color: 'var(--purple)'
                        }}>
                            {toolName}()
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: config.color }}>
                            {config.icon} {config.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Expandable Details */}
            {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 20px', background: 'rgba(0,0,0,0.1)' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* Payload Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Request Payload</span>
                                {status === 'requires_action' && !isEditing && (
                                    <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="btn btn-sm btn-secondary" style={{ padding: '2px 8px', fontSize: 11, gap: 4 }}>
                                        <Edit3 size={12} /> Edit
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <textarea
                                    value={editedPayload}
                                    onChange={(e) => setEditedPayload(e.target.value)}
                                    style={{
                                        width: '100%', height: 120, background: '#090b10', border: '1px solid var(--accent)',
                                        borderRadius: 6, padding: 12, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 12,
                                        outline: 'none', resize: 'vertical'
                                    }}
                                />
                            ) : (
                                <pre style={{
                                    background: '#090b10', padding: 12, borderRadius: 6, margin: 0,
                                    border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)',
                                    fontSize: 12, overflowX: 'auto', maxHeight: 200
                                }}>
                                    {JSON.stringify(toolPayload, null, 2)}
                                </pre>
                            )}
                        </div>

                        {/* Result Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Execution Result</span>
                            <pre style={{
                                background: '#090b10', padding: 12, borderRadius: 6, margin: 0,
                                border: '1px solid var(--border-subtle)', color: status === 'failed' ? 'var(--danger)' : 'var(--text-secondary)',
                                fontSize: 12, overflowX: 'auto', maxHeight: 200, opacity: status === 'pending' || status === 'requires_action' ? 0.5 : 1
                            }}>
                                {toolResult ? JSON.stringify(toolResult, null, 2) : (status === 'requires_action' ? '// Awaiting approval to execute...' : '// No result yet...')}
                            </pre>
                        </div>
                    </div>

                    {/* Action Controls */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ gap: 6, fontSize: 12 }}>
                                    <X size={14} /> Cancel Edit
                                </button>
                                <button onClick={() => {
                                    if (onOverride) onOverride(id, JSON.parse(editedPayload));
                                    setIsEditing(false);
                                }} className="btn btn-primary" style={{ gap: 6, fontSize: 12 }}>
                                    <CheckCircle2 size={14} /> Save & Approve
                                </button>
                            </>
                        ) : (
                            <>
                                {status === 'failed' && onRetry && (
                                    <button onClick={() => onRetry(id)} className="btn btn-secondary" style={{ gap: 6, fontSize: 12 }}>
                                        <RotateCcw size={14} /> Retry Execution
                                    </button>
                                )}
                                {status === 'requires_action' && onApprove && (
                                    <button onClick={() => onApprove(id)} className="btn btn-primary" style={{ gap: 6, fontSize: 12 }}>
                                        <Play size={14} /> Approve Execution
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
