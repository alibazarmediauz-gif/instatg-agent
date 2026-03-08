import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
    Zap, MessageSquare, HelpCircle,
    ArrowRightCircle, Sparkles, Clock,
    Settings2, Share2, MoreHorizontal
} from 'lucide-react';

const nodeThemes = {
    trigger: {
        color: '#8b5cf6',
        icon: <Zap size={16} />,
        label: 'Starting Step',
        bg: 'rgba(139, 92, 246, 0.1)'
    },
    message: {
        color: '#3b82f6',
        icon: <MessageSquare size={16} />,
        label: 'Send Message',
        bg: 'rgba(59, 130, 246, 0.1)'
    },
    aiStep: {
        color: '#ec4899',
        icon: <Sparkles size={16} />,
        label: 'AI Instruction',
        bg: 'rgba(236, 72, 153, 0.1)'
    },
    condition: {
        color: '#f59e0b',
        icon: <HelpCircle size={16} />,
        label: 'Condition',
        bg: 'rgba(245, 158, 11, 0.1)'
    },
    action: {
        color: '#10b981',
        icon: <ArrowRightCircle size={16} />,
        label: 'CRM Action',
        bg: 'rgba(16, 185, 129, 0.1)'
    },
    delay: {
        color: '#6366f1',
        icon: <Clock size={16} />,
        label: 'Smart Delay',
        bg: 'rgba(99, 102, 241, 0.1)'
    },
};

export const CustomNode = memo(({ data, selected, type: reactFlowType }: NodeProps) => {
    // Determine type from data.nodeType (new way) or component type (old way)
    const nodeType = (data.nodeType || reactFlowType) as keyof typeof nodeThemes || 'message';
    const theme = nodeThemes[nodeType] || nodeThemes.message;

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: selected ? `2px solid ${theme.color}` : '1px solid var(--border)',
            borderRadius: '12px',
            minWidth: '260px',
            boxShadow: selected ? `0 0 20px ${theme.color}44` : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
        }}>
            {/* Input Handle */}
            {nodeType !== 'trigger' && (
                <Handle
                    type="target"
                    position={Position.Left}
                    style={{
                        width: 10, height: 10,
                        background: selected ? theme.color : 'var(--border)',
                        border: '2px solid var(--bg-card)',
                        left: -6
                    }}
                />
            )}

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                background: theme.bg,
                borderBottom: '1px solid var(--border)',
                gap: '12px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '8px',
                    background: theme.color,
                    color: 'white',
                    boxShadow: `0 4px 6px ${theme.color}33`
                }}>
                    {theme.icon}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {data.label as string || theme.label}
                    </div>
                    <div style={{ fontSize: 11, color: theme.color, opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {nodeType}
                    </div>
                </div>
                <MoreHorizontal size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
            </div>

            {/* Content Body */}
            <div style={{ padding: '16px', background: 'var(--bg-elevated)' }}>
                {data.content ? (
                    <div style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {data.content as string}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>
                        <Settings2 size={14} /> Tap to configure...
                    </div>
                )}
            </div>

            {/* Source Handles */}
            {nodeType === 'condition' ? (
                <div style={{ position: 'relative', height: 40, borderTop: '1px solid var(--border)', display: 'flex' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 11, fontWeight: 700, color: '#10b981' }}>YES</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12, fontSize: 11, fontWeight: 700, color: '#ef4444' }}>NO</div>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="yes"
                        style={{ top: '25%', background: '#10b981', width: 10, height: 10, border: '2px solid var(--bg-card)' }}
                    />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="no"
                        style={{ top: '75%', background: '#ef4444', width: 10, height: 10, border: '2px solid var(--bg-card)' }}
                    />
                </div>
            ) : (
                <Handle
                    type="source"
                    position={Position.Right}
                    style={{
                        width: 10, height: 10,
                        background: selected ? theme.color : 'var(--border)',
                        border: '2px solid var(--bg-card)',
                        right: -6
                    }}
                />
            )}
        </div>
    );
});

// Map for React Flow
export const customNodeTypes = {
    customNode: CustomNode,
    trigger: CustomNode,
    message: CustomNode,
    aiStep: CustomNode,
    condition: CustomNode,
    action: CustomNode,
    delay: CustomNode,
};
