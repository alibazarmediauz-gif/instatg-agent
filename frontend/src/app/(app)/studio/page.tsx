'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import {
    Bot, Plus, ShieldAlert,
    Database, Activity, Zap, Globe,
    Cpu, Volume2, BookOpen, Fingerprint, Eye, FileText, Sparkles,
    Lock, Terminal, Send
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MarketplaceTemplate {
    id: string;
    name: string;
    role: string;
    icon: React.ReactNode;
    channels: string[];
    tools: string[];
}

const MARKETPLACE_TEMPLATES: MarketplaceTemplate[] = [
    { id: 't_ecom', name: 'E-commerce Qualifier', role: 'Support & Sales', icon: <Zap size={20} color="#f59e0b" />, channels: ['Web', 'Insta'], tools: ['Shopify_Sync', 'AmoCRM'] },
    { id: 't_realestate', name: 'Real Estate Booker', role: 'Lead Qualification', icon: <Volume2 size={20} color="#8b5cf6" />, channels: ['Voice', 'WhatsApp'], tools: ['Calendly', 'AmoCRM'] },
    { id: 't_support', name: 'Technical L1 Support', role: 'Customer Success', icon: <ShieldAlert size={20} color="#10b981" />, channels: ['Web', 'Telegram'], tools: ['Zendesk', 'Jira'] },
    { id: 't_custom', name: 'Custom Blank Agent', role: 'Build From Scratch', icon: <Plus size={20} color="var(--accent)" />, channels: ['Any'], tools: ['Any'] }
];

export default function AgentStudioPage() {
    const router = useRouter();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialAgentId = searchParams?.get('id');

    const [agentId, setAgentId] = useState<string | null>(initialAgentId);
    const [isLoading, setIsLoading] = useState(!!initialAgentId);
    const [step, setStep] = useState<'marketplace' | 'studio'>(initialAgentId ? 'studio' : 'marketplace');

    // State for Config
    const [agentName, setAgentName] = useState('New Agent');
    const [internalRole, setInternalRole] = useState('Sales');
    const [systemPrompt, setSystemPrompt] = useState(`You are a highly efficient AI Sales Agent...`);
    const [sliders, setSliders] = useState({ length: 50, tone: 65, aggressiveness: 50 });
    const [selectedKnowledge, setSelectedKnowledge] = useState<string[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    // Fetch existing agent if ID is present
    useEffect(() => {
        if (agentId) {
            const fetchAgent = async () => {
                try {
                    const res = await fetch(`/api/agents/${agentId}`);
                    const data = await res.json();
                    if (data.status === 'success') {
                        const agent = data.data;
                        setAgentName(agent.name);
                        setInternalRole(agent.internal_role || 'Sales');
                        setSystemPrompt(agent.system_prompt || '');
                        if (agent.settings?.behavior_sliders) {
                            setSliders(agent.settings.behavior_sliders);
                        }
                        if (agent.knowledge_documents) {
                            setSelectedKnowledge(agent.knowledge_documents.map((d: any) => d.id));
                        }
                        setStep('studio');
                    }
                } catch (err) {
                    console.error('Failed to load agent:', err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAgent();
        }
    }, [agentId]);

    const handleDeploy = async () => {
        setIsSaving(true);
        try {
            const url = agentId ? `/api/agents/chat/${agentId}` : '/api/agents/chat';
            const method = agentId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: agentName,
                    internal_role: internalRole,
                    system_prompt: systemPrompt,
                    settings: {
                        behavior_sliders: sliders,
                    },
                    knowledge_ids: selectedKnowledge
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                router.push('/agents');
            }
        } catch (err) {
            alert('Failed to deploy agent');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <Bot className="animate-bounce" size={48} color="var(--accent)" />
                    <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Loading Persona Workspace...</p>
                </div>
            </div>
        );
    }

    if (step === 'marketplace') {
        return (
            <div className="page-container animate-in" style={{ padding: '40px', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', maxWidth: 600, marginBottom: 40 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--gradient-premium)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)' }}>
                        <Cpu size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12 }}>Agent Studio Marketplace</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6 }}>
                        Choose a foundational AI Template to begin, or start from scratch. These playbooks come pre-wired with specific APIs and prompt constraints.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, width: '100%', maxWidth: 1000 }}>
                    {MARKETPLACE_TEMPLATES.map(tpl => (
                        <div key={tpl.id}
                            className="card"
                            style={{ padding: 24, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}
                            onClick={() => { setSelectedTemplate(tpl); setStep('studio'); }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(59, 130, 246, 0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {tpl.icon}
                            </div>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>{tpl.name}</h3>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tpl.role}</div>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {tpl.channels.map(c => <span key={c} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', fontWeight: 700 }}>{c}</span>)}
                                {tpl.tools.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', fontWeight: 700 }}>{t}</span>)}
                            </div>
                        </div>
                    ))}
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 40 }} onClick={() => router.push('/agents')}>← Back to Roster</button>
            </div>
        );
    }

    return (
        <div className="page-container animate-in" style={{ padding: '0', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setStep('marketplace')}>←</button>
                    <div>
                        <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Bot size={18} color="var(--accent)" /> Editing: {agentName}
                        </h1>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><Eye size={14} /> Draft Saved</span>
                    <button className="btn btn-primary" style={{ padding: '6px 16px' }} onClick={handleDeploy} disabled={isSaving}>
                        {isSaving ? 'Deploying...' : 'Deploy to Workforce'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) minmax(350px, 1fr)', flex: 1, minHeight: 0 }}>
                {/* LEFT PANE: Configuration IDE */}
                <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg-main)' }}>

                    {/* Config Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px', gap: 24 }}>
                        <button className={`tab-btn ${activeTab === 'persona' ? 'active' : ''}`} onClick={() => setActiveTab('persona')} style={{ padding: '16px 0', background: 'none', border: 'none', color: activeTab === 'persona' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: activeTab === 'persona' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer' }}>
                            <Fingerprint size={14} style={{ marginRight: 6, display: 'inline' }} /> Persona & Prompt
                        </button>
                        <button className={`tab-btn ${activeTab === 'knowledge' ? 'active' : ''}`} onClick={() => setActiveTab('knowledge')} style={{ padding: '16px 0', background: 'none', border: 'none', color: activeTab === 'knowledge' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: activeTab === 'knowledge' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer' }}>
                            <Database size={14} style={{ marginRight: 6, display: 'inline' }} /> Knowledge Context
                        </button>
                        <button className={`tab-btn ${activeTab === 'capabilities' ? 'active' : ''}`} onClick={() => setActiveTab('capabilities')} style={{ padding: '16px 0', background: 'none', border: 'none', color: activeTab === 'capabilities' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: activeTab === 'capabilities' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer' }}>
                            <Activity size={14} style={{ marginRight: 6, display: 'inline' }} /> Capabilities & Tools
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
                        {activeTab === 'persona' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                <div>
                                    <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Agent Identity</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Display Name</label>
                                            <input type="text" className="input" value={agentName} onChange={e => setAgentName(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'white' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Internal Role</label>
                                            <input type="text" className="input" value={internalRole} onChange={e => setInternalRole(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'white' }} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>System Prompt Engineering</h3>
                                        <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }}><SparklesIcon /> AI Generate</button>
                                    </div>
                                    <textarea className="input" style={{ width: '100%', height: 180, padding: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, resize: 'vertical' }}
                                        value={systemPrompt}
                                        onChange={e => setSystemPrompt(e.target.value)}
                                    />
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Use {"{{"}variables{"}}"} to inject dynamic CRM context.</p>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>Behavioral Sliders</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <SliderSetting label="Response Length" left="Concise" right="Detailed" value={sliders.length} onChange={v => setSliders({ ...sliders, length: v })} />
                                        <SliderSetting label="Tone of Voice" left="Professional" right="Casual / Emoji" value={sliders.tone} onChange={v => setSliders({ ...sliders, tone: v })} />
                                        <SliderSetting label="Sales Aggressiveness" left="Consultative" right="Hard Close" value={sliders.aggressiveness} onChange={v => setSliders({ ...sliders, aggressiveness: v })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'knowledge' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div className="card" style={{ padding: 24, border: '1px dashed var(--accent)', background: 'rgba(59, 130, 246, 0.02)', textAlign: 'center' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                        <BookOpen size={24} color="var(--accent)" />
                                    </div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Inject Knowledge Base</h3>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, maxWidth: 300, margin: '0 auto 16px' }}>Upload PDFs, sync a Google Sheet, or link a website to give this agent factual memory.</p>
                                    <button className="btn btn-secondary" style={{ margin: '0 auto' }}>+ Add Data Source</button>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Active Context Boundaries</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <FileText size={16} color="var(--purple)" />
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>Objection_Handling_2024.pdf</span>
                                            </div>
                                            <div className="switch active" />
                                        </div>
                                        <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Globe size={16} color="#10b981" />
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>Crawl: docs.example.com</span>
                                            </div>
                                            <div className="switch active" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'capabilities' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                                <div>
                                    <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Tool Access (APIs)</h3>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Enable which external tools this agent is authorized to execute autonomously.</p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <Database size={16} color="var(--accent)" />
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700 }}>amoCRM Write Access</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Allow updating lead stages and pipelines</div>
                                                </div>
                                            </div>
                                            <div className="switch active" />
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <CalendarIcon size={16} color="#8b5cf6" />
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700 }}>Calendly Booking</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Allow agent to read availability and book slots</div>
                                                </div>
                                            </div>
                                            <div className="switch active" />
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, opacity: 0.6 }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <Lock size={16} color="var(--danger)" />
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700 }}>Execute Payments (Stripe)</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Generate checkout links and capture funds</div>
                                                </div>
                                            </div>
                                            <div className="switch" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Workflow Orchestration Link</h3>
                                    <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <NetworkNodesIcon size={16} color="var(--warning)" />
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>Linked to Playbook: Inbound Qualifier Path</span>
                                        </div>
                                        <button className="btn btn-sm btn-ghost" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Change</button>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: Live Sandbox Environment */}
                <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Terminal size={14} color="var(--success)" /> Live Sandbox Simulator
                        </h3>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setChatLog([{ role: 'system', text: 'Sandbox reset.' }])}>Reset</button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {chatLog.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4
                            }}>
                                {msg.role === 'system' && (
                                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <ShieldAlert size={10} /> {msg.text}
                                    </div>
                                )}
                                {msg.role === 'user' && (
                                    <div style={{ background: 'var(--accent)', color: 'white', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', fontSize: 13, lineHeight: 1.5 }}>
                                        {msg.text}
                                    </div>
                                )}
                                {msg.role === 'ai' && (
                                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', fontSize: 13, lineHeight: 1.5 }}>
                                        {msg.text}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isSimulating && (
                            <div style={{ alignSelf: 'flex-start', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', fontSize: 11, color: 'var(--text-muted)' }}>
                                Agent is thinking...
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="Test your agent's responses..."
                                value={inputMsg}
                                onChange={e => setInputMsg(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSimulateSend()}
                                style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 24, fontSize: 13 }}
                                disabled={isSimulating}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleSimulateSend}
                                disabled={isSimulating}
                                style={{ width: 44, height: 44, padding: 0, borderRadius: '50%', justifyContent: 'center' }}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                            Sandbox mode simulates tool outputs and API calls without executing them in production.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Components
function SliderSetting({ label, left, right, value, onChange }: { label: string, left: string, right: string, value: number, onChange: (v: number) => void }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 10, color: 'var(--accent)' }}>{value}%</span>
            </div>
            <div style={{ position: 'relative', height: 4, background: 'var(--bg-elevated)', borderRadius: 2, marginBottom: 8, cursor: 'pointer' }}
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    onChange(Math.max(0, Math.min(100, percent)));
                }}
            >
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${value}%`, background: 'var(--accent)', borderRadius: 2 }} />
                <div style={{ position: 'absolute', top: -4, left: `calc(${value}% - 6px)`, width: 12, height: 12, borderRadius: '50%', background: 'white', border: '2px solid var(--accent)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>{left}</span>
                <span>{right}</span>
            </div>
        </div>
    );
}
return (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
        </div>
        <div style={{ position: 'relative', height: 4, background: 'var(--bg-elevated)', borderRadius: 2, marginBottom: 8 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${value}%`, background: 'var(--accent)', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: -4, left: `calc(${value}% - 6px)`, width: 12, height: 12, borderRadius: '50%', background: 'white', border: '2px solid var(--accent)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
            <span>{left}</span>
            <span>{right}</span>
        </div>
    </div>
);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SparklesIcon(props: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
}

function CalendarIcon({ size = 16, color = "currentColor" }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
}

function NetworkNodesIcon({ size = 16, color = "currentColor" }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
}
