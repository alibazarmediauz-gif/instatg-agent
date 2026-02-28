import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageCircle, Zap, Clock, Type, Settings2, Sparkles, AlertCircle } from 'lucide-react';

const nodeStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '16px',
    minWidth: 280,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderBottom: '1px solid var(--border)',
    paddingBottom: 12,
};

// ---------------------------------------------------------------------------
// Trigger Node
// ---------------------------------------------------------------------------
export const TriggerNode = ({ data }: any) => {
    return (
        <div style={{ ...nodeStyle, borderTop: '4px solid #3B82F6' }}>
            <div style={headerStyle}>
                <div style={{ background: '#3B82F620', color: '#3B82F6', padding: 8, borderRadius: 8 }}>
                    <Zap size={20} />
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Starting Step</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Trigger</div>
                </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {data.keyword ? `Keyword: "${data.keyword}"` : 'All Incoming Messages'}
            </div>
            <Handle type="source" position={Position.Right} style={{ background: '#3B82F6' }} />
        </div>
    );
};

// ---------------------------------------------------------------------------
// Message Node
// ---------------------------------------------------------------------------
export const MessageNode = ({ data }: any) => {
    return (
        <div style={{ ...nodeStyle, borderTop: '4px solid #10B981' }}>
            <Handle type="target" position={Position.Left} style={{ background: '#10B981' }} />
            <div style={headerStyle}>
                <div style={{ background: '#10B98120', color: '#10B981', padding: 8, borderRadius: 8 }}>
                    <MessageCircle size={20} />
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Send Message</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Telegram / Instagram</div>
                </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 8 }}>
                {data.text ? (data.text.length > 60 ? data.text.substring(0, 60) + '...' : data.text) : <i>Bo'sh xabar</i>}
            </div>
            <Handle type="source" position={Position.Right} style={{ background: '#10B981' }} />
        </div>
    );
};

// ---------------------------------------------------------------------------
// AI Step Node
// ---------------------------------------------------------------------------
export const AIStepNode = ({ data }: any) => {
    return (
        <div style={{ ...nodeStyle, borderTop: '4px solid #8B5CF6' }}>
            <Handle type="target" position={Position.Left} style={{ background: '#8B5CF6' }} />
            <div style={headerStyle}>
                <div style={{ background: '#8B5CF620', color: '#8B5CF6', padding: 8, borderRadius: 8 }}>
                    <Sparkles size={20} />
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>AI Step</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Let AI handle conversation</div>
                </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {data.prompt ? `Custom Context:` : 'Default AI Agent Persona'}
            </div>
            <Handle type="source" position={Position.Right} style={{ background: '#8B5CF6' }} />
        </div>
    );
};

// ---------------------------------------------------------------------------
// Delay Node
// ---------------------------------------------------------------------------
export const DelayNode = ({ data }: any) => {
    return (
        <div style={{ ...nodeStyle, borderTop: '4px solid #F59E0B' }}>
            <Handle type="target" position={Position.Left} style={{ background: '#F59E0B' }} />
            <div style={headerStyle}>
                <div style={{ background: '#F59E0B20', color: '#F59E0B', padding: 8, borderRadius: 8 }}>
                    <Clock size={20} />
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Smart Delay</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Wait before next step</div>
                </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>
                {data.amount || 1} {data.unit || 'minutes'}
            </div>
            <Handle type="source" position={Position.Right} style={{ background: '#F59E0B' }} />
        </div>
    );
};

export const customNodeTypes = {
    trigger: TriggerNode,
    message: MessageNode,
    aiStep: AIStepNode,
    delay: DelayNode,
};
