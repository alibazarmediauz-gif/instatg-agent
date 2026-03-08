import React from 'react';
import { Bot, MessageSquare, Zap, Clock, HelpCircle, ArrowRightCircle, X, Sparkles, Settings2 } from 'lucide-react';

interface NodePropertiesProps {
    node: any;
    onUpdate: (id: string, data: any) => void;
    onClose: () => void;
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onUpdate, onClose }) => {
    if (!node) return null;

    const { id, data } = node;
    const nodeType = data.nodeType || 'message';

    const handleUpdate = (field: string, value: any) => {
        onUpdate(id, { ...data, [field]: value });
    };

    const renderFields = () => {
        switch (nodeType) {
            case 'trigger':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Trigger Event</label>
                            <select
                                className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                                value={data.event || 'message'}
                                onChange={(e) => handleUpdate('event', e.target.value)}
                            >
                                <option value="message">User sends a message</option>
                                <option value="keyword">User sends a specific keyword</option>
                                <option value="comment">User comments on a post</option>
                                <option value="link">User clicks a referral link</option>
                            </select>
                        </div>
                        {data.event === 'keyword' && (
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Keyword (comma separated)</label>
                                <input
                                    className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                                    placeholder="e.g. narx, price, buy"
                                    value={data.keyword || ''}
                                    onChange={(e) => handleUpdate('keyword', e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                );
            case 'message':
                return (
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Message Text</label>
                        <textarea
                            className="w-full bg-background border border-border rounded-lg p-3 text-sm min-h-[120px]"
                            placeholder="Type your message here..."
                            value={data.content || ''}
                            onChange={(e) => handleUpdate('content', e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground mt-2">Use {'{{variable}}'} to inject lead data.</p>
                    </div>
                );
            case 'aiStep':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">AI Goal</label>
                            <input
                                className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                                placeholder="e.g. Qualify the lead for budget"
                                value={data.goal || ''}
                                onChange={(e) => handleUpdate('goal', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Additional Context</label>
                            <textarea
                                className="w-full bg-background border border-border rounded-lg p-3 text-sm min-h-[100px]"
                                placeholder="Specific instructions for this step..."
                                value={data.content || ''}
                                onChange={(e) => handleUpdate('content', e.target.value)}
                            />
                        </div>
                    </div>
                );
            case 'delay':
                return (
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Amount</label>
                            <input
                                type="number"
                                className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                                value={data.amount || 1}
                                onChange={(e) => handleUpdate('amount', e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Unit</label>
                            <select
                                className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                                value={data.unit || 'minutes'}
                                onChange={(e) => handleUpdate('unit', e.target.value)}
                            >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                            </select>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
                        <Settings2 className="mx-auto mb-2 opacity-20" size={32} />
                        <p className="text-xs text-muted-foreground font-medium">Standard properties for this block type are coming soon.</p>
                    </div>
                );
        }
    };

    return (
        <div style={{
            width: '320px',
            height: '100%',
            background: 'var(--bg-card)',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out'
        }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Settings2 size={16} color="var(--accent)" />
                    Configuration
                </h3>
                <button onClick={onClose} className="hover:bg-accent p-1 rounded-md transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                <div className="mb-6">
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Block Label</label>
                    <input
                        className="w-full bg-background border border-border rounded-lg p-2 text-sm font-bold"
                        value={data.label || ''}
                        placeholder="Enter step name..."
                        onChange={(e) => handleUpdate('label', e.target.value)}
                    />
                </div>

                <div className="h-[1px] bg-border my-6" />

                {renderFields()}
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <p className="text-[10px] text-muted-foreground italic">Changes are saved to the canvas automatically.</p>
            </div>

            <style jsx>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};
