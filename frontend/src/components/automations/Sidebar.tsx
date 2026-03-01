import React from 'react';
import { Zap, MessageSquare, HelpCircle, ArrowRightCircle, GripVertical } from 'lucide-react';

export const Sidebar = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const DraggableItem = ({ type, icon, title, description, bg }: { type: string, icon: React.ReactNode, title: string, description: string, bg: string }) => (
        <div
            onDragStart={(event) => onDragStart(event, type)}
            draggable
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                background: 'var(--bg-elevated)',
                cursor: 'grab',
                marginBottom: '12px',
                transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = bg}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
            <div style={{ padding: '8px', borderRadius: '8px', background: `${bg}22`, color: bg, marginRight: '12px' }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</div>
            </div>
            <GripVertical size={16} color="var(--text-muted)" style={{ opacity: 0.5 }} />
        </div>
    );

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 16 }}>Node Types</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>Drag and drop these blocks onto the canvas.</p>

            <DraggableItem
                type="trigger"
                icon={<Zap size={18} />}
                title="Event Trigger"
                description="Start flow on message or tag"
                bg="#8b5cf6"
            />

            <DraggableItem
                type="message"
                icon={<MessageSquare size={18} />}
                title="Send Message"
                description="Reply with text or media"
                bg="#3b82f6"
            />

            <DraggableItem
                type="condition"
                icon={<HelpCircle size={18} />}
                title="Condition"
                description="Branch flow based on data"
                bg="#f59e0b"
            />

            <DraggableItem
                type="action"
                icon={<ArrowRightCircle size={18} />}
                title="CRM Action"
                description="Update tags or stages"
                bg="#10b981"
            />
        </div>
    );
};
