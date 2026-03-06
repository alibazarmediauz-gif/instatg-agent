'use client';

import { useState, useEffect } from 'react';
import {
    BookOpen, Plus, Save, RotateCcw,
    CheckCircle, Activity, SplitSquareHorizontal,
    MoreHorizontal, Copy, Loader2
} from 'lucide-react';

import { useTenant } from '@/lib/TenantContext';
import { getChatAgents, getPrompts, createPrompt, setActivePrompt } from '@/lib/api';

export default function PromptLibraryPage() {
    const { tenantId } = useTenant();
    const [agents, setAgents] = useState<any[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [prompts, setPrompts] = useState<any[]>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchAgents = async () => {
        try {
            const data = await getChatAgents(tenantId) as any;
            if (data && data.length > 0) {
                setAgents(data);
                setSelectedAgentId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch agents:", error);
        }
    };

    const fetchPrompts = async (agentId: string) => {
        if (!agentId) return;
        setLoading(true);
        try {
            const data = await getPrompts(tenantId, agentId) as any;
            if (data.status === 'success') {
                setPrompts(data.data || []);
                if (data.data && data.data.length > 0 && !selectedPrompt) {
                    setSelectedPrompt(data.data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch prompts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, [tenantId]);

    useEffect(() => {
        if (selectedAgentId) {
            fetchPrompts(selectedAgentId);
        }
    }, [selectedAgentId]);

    const handleNewVersion = async (content: string = "New system prompt template...", isActive: boolean = false) => {
        if (!selectedAgentId) return;
        setSaving(true);
        try {
            const data = await createPrompt(tenantId, {
                agent_id: selectedAgentId,
                system_prompt: content,
                is_active: isActive
            });
            if (data) {
                fetchPrompts(selectedAgentId);
                setSelectedPrompt(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleActivate = async (promptId: string) => {
        if (!selectedAgentId) return;
        try {
            await setActivePrompt(tenantId, promptId);
            fetchPrompts(selectedAgentId);
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <Loader2 className="animate-spin" size={32} color="var(--text-muted)" />
            </div>
        );
    }

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Prompt Library</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Version control and A/B testing for your AI Sales Brain.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" style={{ gap: 8 }}><SplitSquareHorizontal size={14} /> Run A/B Test</button>
                    <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => handleNewVersion()} disabled={saving}>
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} New Version
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 24, flex: 1, overflow: 'hidden' }}>
                {/* Left: Agents + Version History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Agent Selector */}
                    <div className="card" style={{ padding: '16px 20px' }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Select Agent</label>
                        <select
                            value={selectedAgentId}
                            onChange={(e) => {
                                setSelectedAgentId(e.target.value);
                                setSelectedPrompt(null);
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                color: 'var(--text-primary)',
                                fontSize: 13,
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {agents.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', flex: 1 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Version History</h3>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {prompts.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedPrompt(p)}
                                    style={{
                                        padding: '16px 20px',
                                        borderBottom: '1px solid var(--border)',
                                        cursor: 'pointer',
                                        background: selectedPrompt?.id === p.id ? 'var(--bg-elevated)' : 'transparent',
                                        borderLeft: selectedPrompt?.id === p.id ? '3px solid var(--accent)' : '3px solid transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>#{p.version_hash}</div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: p.is_active ? 'var(--success)' : 'var(--text-muted)' }}>
                                            {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                                        {agents.find(a => a.id === selectedAgentId)?.name || 'Agent'}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={12} /> {p.performance_score}% Conv.</span>
                                        <span>{new Date(p.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Editor */}
                    {selectedPrompt ? (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>#{selectedPrompt.version_hash}</h3>
                                    {selectedPrompt.is_active && <span className="badge success" style={{ gap: 4 }}><CheckCircle size={12} /> Production</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="icon-btn" title="Duplicate" onClick={() => handleNewVersion(selectedPrompt.system_prompt)}><Copy size={14} /></button>
                                    {!selectedPrompt.is_active && (
                                        <button className="btn btn-secondary btn-sm" style={{ gap: 6 }} onClick={() => handleActivate(selectedPrompt.id)}><RotateCcw size={14} /> Promote to Active</button>
                                    )}
                                    <button className="btn btn-primary btn-sm" style={{ gap: 6 }} onClick={() => handleNewVersion(selectedPrompt.system_prompt, selectedPrompt.is_active)} disabled={saving}>
                                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save as New Version
                                    </button>
                                </div>
                            </div>
                            <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block', padding: '16px 20px 0' }}>Master System Prompt</label>
                                <textarea
                                    value={selectedPrompt.system_prompt}
                                    onChange={(e) => setSelectedPrompt({ ...selectedPrompt, system_prompt: e.target.value })}
                                    style={{
                                        flex: 1,
                                        margin: '0 20px 20px',
                                        background: 'transparent',
                                        border: '1px solid var(--border)',
                                        borderRadius: 8,
                                        padding: 16,
                                        color: 'var(--text-primary)',
                                        fontSize: 14,
                                        fontFamily: 'monospace',
                                        resize: 'none',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            Select or create a prompt version.
                        </div>
                    )}
                </div>
            </div>
            );
}
