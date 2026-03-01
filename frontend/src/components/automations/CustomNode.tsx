import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap, MessageSquare, HelpCircle, ArrowRightCircle } from 'lucide-react';

const nodeStyles = {
    trigger: { bg: '#8b5cf6', icon: <Zap size={16} color="white" />, title: 'Trigger' },
    message: { bg: '#3b82f6', icon: <MessageSquare size={16} color="white" />, title: 'Send Message' },
    condition: { bg: '#f59e0b', icon: <HelpCircle size={16} color="white" />, title: 'Condition (If/Else)' },
    action: { bg: '#10b981', icon: <ArrowRightCircle size={16} color="white" />, title: 'CRM Action' },
};

export const CustomNode = memo(({ data, type, isConnectable }: NodeProps) => {
    const nodeType = (data.nodeType as keyof typeof nodeStyles) || 'message';
    const style = nodeStyles[nodeType];

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: `2px solid ${style.bg}`,
            borderRadius: '12px',
            minWidth: '220px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            overflow: 'hidden',
        }}>
            {/* Target Handle (Top) - Triggers don't have inputs */}
            {nodeType !== 'trigger' && (
                <Handle
                    type="target"
                    position={Position.Top}
                    isConnectable={isConnectable}
                    style={{ width: 12, height: 12, background: 'var(--text-muted)' }}
                />
            )}

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                background: style.bg,
                gap: '8px'
            }}>
                {style.icon}
                <strong style={{ color: 'white', fontSize: 13, flex: 1 }}>{data.label as string || style.title}</strong>
            </div>

            {/* Body */}
            <div style={{ padding: '12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                {data.content ? (
                    <div style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {data.content as string}
                    </div>
                ) : (
                    <div style={{ fontStyle: 'italic', opacity: 0.6 }}>No content configured</div>
                )}
            </div>

            {/* Source Handle (Bottom) */}
            {nodeType === 'condition' ? (
                <>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="true"
                        isConnectable={isConnectable}
                        style={{ left: '25%', background: '#10b981', width: 12, height: 12 }}
                    />
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="false"
                        isConnectable={isConnectable}
                        style={{ left: '75%', background: '#ef4444', width: 12, height: 12 }}
                    />
                </>
            ) : (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    isConnectable={isConnectable}
                    style={{ width: 12, height: 12, background: style.bg }}
                />
            )}
        </div>
    );
});
