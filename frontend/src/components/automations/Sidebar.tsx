import React from 'react';
import { Zap, MessageSquare, HelpCircle, ArrowRightCircle, GripVertical, Sparkles, Clock, MousePointer2 } from 'lucide-react';

export const Sidebar = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const DraggableItem = ({ type, icon, title, bg }: { type: string, icon: React.ReactNode, title: string, bg: string }) => (
        <div
            onDragStart={(event) => onDragStart(event, type)}
            draggable
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                cursor: 'grab',
                marginBottom: '8px',
                transition: 'all 0.2s',
                gap: '10px'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = bg}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
            <div style={{
                padding: '6px',
                borderRadius: '6px',
                background: bg,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {icon}
            </div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
            <GripVertical size={14} color="var(--text-muted)" style={{ opacity: 0.3 }} />
        </div>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <h3 style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            marginTop: '24px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8
        }}>
            <span style={{ width: 12, height: 1.5, background: 'var(--border)' }} />
            {title}
        </h3>
    );

    return (
        <div style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--bg-card)',
            borderRight: '1px solid var(--border)',
            width: '240px',
            overflowY: 'auto'
        }}>
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Toolbox</h2>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Drag blocks to build your flow.</p>
            </div>

            <SectionHeader title="Starting Step" />
            <DraggableItem
                type="trigger"
                icon={<Zap size={14} />}
                title="Trigger"
                bg="#8b5cf6"
            />

            <SectionHeader title="Content" />
            <DraggableItem
                type="message"
                icon={<MessageSquare size={14} />}
                title="Send Message"
                bg="#3b82f6"
            />

            <SectionHeader title="AI Intelligence" />
            <DraggableItem
                type="aiStep"
                icon={<Sparkles size={14} />}
                title="AI Instruction"
                bg="#ec4899"
            />

            <SectionHeader title="Logic & Flow" />
            <DraggableItem
                type="condition"
                icon={<HelpCircle size={14} />}
                title="Condition"
                bg="#f59e0b"
            />
            <DraggableItem
                type="delay"
                icon={<Clock size={14} />}
                title="Smart Delay"
                bg="#6366f1"
            />

            <SectionHeader title="Actions" />
            <DraggableItem
                type="action"
                icon={<ArrowRightCircle size={14} />}
                title="CRM Action"
                bg="#10b981"
            />

            <div style={{ marginTop: 'auto', padding: '16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--accent)' }}>
                    <MousePointer2 size={14} />
                    <span style={{ fontSize: 11, fontWeight: 700 }}>Pro Tip</span>
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Double-click a block to quickly open its settings.
                </p>
            </div>
        </div>
    );
};
