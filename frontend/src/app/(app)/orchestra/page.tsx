'use client';

import {
    Workflow, Play, GitBranch, Zap, MessageSquare,
    Database, ShieldAlert, Plus, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function OrchestraBuilder() {
    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Workflow size={28} color="var(--accent)" /> Orchestra Playbooks
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Design autonomous agent workflows combining reasoning, routing, and tool execution.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary">Load Template</button>
                    <button className="btn btn-primary" style={{ gap: 8 }}>
                        <Play size={14} /> Simulate Flow
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
                {/* LEFT: Node Canvas (Mock visual representation) */}
                <div className="card" style={{ flex: 1, padding: 0, overflowY: 'auto', background: 'var(--bg-elevated)', position: 'relative' }}>
                    {/* Background Grid Pattern */}
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    <div style={{ position: 'relative', zIndex: 1, padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

                        {/* Trigger Node */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ background: 'var(--purple)', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)' }}>
                                <MessageSquare size={14} /> Incoming Telegram Message
                            </div>
                        </div>

                        <div style={{ width: 2, height: 32, background: 'var(--border)' }}></div>

                        {/* Reasoning Node */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="card" style={{ width: 320, padding: 16, border: '1px solid var(--accent)', boxShadow: '0 4px 30px rgba(59, 130, 246, 0.15)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <Zap size={14} /> Agent Reasoning
                                    </span>
                                    <span className="badge neutral">SDR_Sarah</span>
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Analyze user intent: Is this a pricing inquiry, tech support, or generic chat?</div>
                            </div>
                        </div>

                        <div style={{ width: 2, height: 32, background: 'var(--border)' }}></div>

                        {/* Condition / Branching Node */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                                <GitBranch size={14} /> Condition: Intent == "Pricing"
                            </div>

                            {/* Lines joining from condition to branches */}
                            <div style={{ position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)', width: 400, height: 2, background: 'var(--border)' }}></div>
                            <div style={{ position: 'absolute', top: 32, left: '50%', transform: 'translateX(-200px)', width: 2, height: 32, background: 'var(--border)' }}></div>
                            <div style={{ position: 'absolute', top: 32, right: '50%', transform: 'translateX(200px)', width: 2, height: 32, background: 'var(--border)' }}></div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, marginTop: 32 }}>
                            {/* Left Branch (Yes) */}
                            <div style={{ width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
                                <span className="badge success" style={{ marginBottom: -16, zIndex: 1 }}>If YES</span>

                                <div className="card" style={{ width: '100%', padding: 16, borderLeft: '4px solid var(--accent)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', gap: 6 }}>
                                        <Database size={14} color="var(--accent)" /> Tool Execution
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>amoCRM.get_lead_context</div>
                                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 4 }}>
                                        {`{ "phone": "{{user.phone}}" }`}
                                    </div>
                                </div>

                                <div style={{ width: 2, height: 32, background: 'var(--border)' }}></div>

                                <div className="card" style={{ width: '100%', padding: 16, borderLeft: '4px solid var(--warning)', background: 'rgba(245, 158, 11, 0.05)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', gap: 6 }}>
                                        <ShieldAlert size={14} /> HITL Approval
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Require human to approve outgoing enterprise quote.</div>
                                </div>
                            </div>

                            {/* Right Branch (No) */}
                            <div style={{ width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
                                <span className="badge neutral" style={{ marginBottom: -16, zIndex: 1 }}>If NO</span>

                                <div className="card" style={{ width: '100%', padding: 16, borderLeft: '4px solid var(--text-muted)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', gap: 6 }}>
                                        <MessageSquare size={14} /> Chat Response
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Use RAG knowledge base to answer technical question or converse naturally.</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT: Node Inspector / Toolbox */}
                <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Node Inspector</h3>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Node Name</label>
                                <input type="text" defaultValue="amoCRM.get_lead_context" className="input" style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 6, color: 'var(--text-primary)' }} />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Assigned Agent / Persona</label>
                                <select className="input" style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 6, color: 'var(--text-primary)' }}>
                                    <option>SDR_Sarah</option>
                                    <option>Support_BotX</option>
                                </select>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>Require Approval</span>
                                    <div className="switch" />
                                </div>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>If enabled, this action will pause and wait in the Action Queue until manually approved.</p>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Tool Library</h3>
                        </div>
                        <div style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'flex-start', border: '1px dashed var(--border-subtle)' }}><Plus size={14} style={{ marginRight: 8 }} /> Agent Reasoning</div>
                            <div className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'flex-start', border: '1px dashed var(--border-subtle)' }}><Plus size={14} style={{ marginRight: 8 }} /> Condition Branch</div>
                            <div className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'flex-start', border: '1px dashed var(--border-subtle)' }}><Plus size={14} style={{ marginRight: 8 }} /> amoCRM Tool</div>
                            <div className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'flex-start', border: '1px dashed var(--border-subtle)' }}><Plus size={14} style={{ marginRight: 8 }} /> HITL Approval</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
