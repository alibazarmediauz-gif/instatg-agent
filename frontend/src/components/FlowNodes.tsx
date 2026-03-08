import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, MessageSquare, Database, GitBranch, ShieldAlert } from 'lucide-react';

const handleStyleParams = {
    width: 10, height: 10, background: 'var(--bg)', border: '2px solid var(--border)'
};

// 1. Trigger Node
export const TriggerNode = memo(({ data }: any) => {
    return (
        <div style={{
            background: 'var(--purple)', color: 'white', padding: '12px 16px',
            borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)', minWidth: 220
        }}>
            <MessageSquare size={16} />
            <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>Trigger</div>
                <div>{data.label}</div>
            </div>
            <Handle type="source" position={Position.Bottom} style={{ ...handleStyleParams, borderColor: 'var(--purple)' }} />
        </div>
    );
});

// 2. AI Reasoning Node
export const ReasoningNode = memo(({ data }: any) => {
    return (
        <div className="card" style={{ width: 280, padding: 16, border: '2px solid var(--accent)', boxShadow: '0 4px 30px rgba(59, 130, 246, 0.15)', background: 'var(--bg-card)' }}>
            <Handle type="target" position={Position.Top} style={handleStyleParams} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Zap size={14} /> Agent Reasoning
                </span>
                <span className="badge neutral" style={{ fontSize: 10 }}>{data.agentName || 'AI'}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{data.instruction}</div>
            <Handle type="source" position={Position.Bottom} style={{ ...handleStyleParams, borderColor: 'var(--accent)' }} />
        </div>
    );
});

// 3. Condition / Branch Node
export const ConditionNode = memo(({ data }: any) => {
    return (
        <div style={{
            background: 'var(--bg-elevated)', border: '2px dashed var(--warning)', padding: '12px 16px',
            borderRadius: 12, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
            color: 'var(--text-primary)', minWidth: 240
        }}>
            <Handle type="target" position={Position.Top} style={handleStyleParams} />
            <GitBranch size={16} color="var(--warning)" />
            <div>
                <div style={{ fontSize: 10, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Condition</div>
                <div>{data.condition}</div>
            </div>
            <Handle type="source" position={Position.Bottom} id="true" style={{ ...handleStyleParams, left: '25%', borderColor: 'var(--success)' }} />
            <Handle type="source" position={Position.Bottom} id="false" style={{ ...handleStyleParams, left: '75%', borderColor: 'var(--danger)' }} />
        </div>
    );
});

// 4. Tool Execution Node
export const ToolNode = memo(({ data }: any) => {
    return (
        <div className="card" style={{ width: 300, padding: 0, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <Handle type="target" position={Position.Top} style={handleStyleParams} />
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={14} color="var(--purple)" />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Execute Tool</span>
            </div>
            <div style={{ padding: '16px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'monospace' }}>{data.toolName}</div>
                {data.payload && (
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: 10, borderRadius: 6, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(data.payload, null, 2)}
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} style={handleStyleParams} />
        </div>
    );
});

// 5. Human Escalation (HITL) Node
export const EscalationNode = memo(({ data }: any) => {
    return (
        <div className="card" style={{ width: 280, padding: 16, border: '2px solid var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <Handle type="target" position={Position.Top} style={handleStyleParams} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldAlert size={14} color="white" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase' }}>Human Takeover</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{data.reason}</div>
            <Handle type="source" position={Position.Bottom} style={{ ...handleStyleParams, borderColor: 'var(--danger)' }} />
        </div>
    );
});
