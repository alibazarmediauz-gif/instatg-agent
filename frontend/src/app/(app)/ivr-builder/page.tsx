'use client';

import { useState } from 'react';
import {
    Network, FileJson, Save, Plus,
    MousePointer2, Settings2, Play,
    MessageSquare, PhoneCall, UserCheck,
    ArrowRight, Clock, AlertTriangle, ChevronRight, Zap, GripHorizontal, HandMetal
} from 'lucide-react';

export default function IVRBuilder() {
    const [nodes, setNodes] = useState([
        { id: '1', type: 'trigger', data: { label: 'Inbound Call', value: '+998 71 200 00 00' }, position: { x: 400, y: 100 } },
        { id: '2', type: 'brain', data: { label: 'AI Sales Brain', prompt: 'SDR Strategy' }, position: { x: 400, y: 300 } },
        { id: '3', type: 'action', data: { label: 'Transfer', to: 'Manager Alex' }, position: { x: 600, y: 500 } },
        { id: '4', type: 'action', data: { label: 'Voice Message', file: 'greeting_uz.mp3' }, position: { x: 200, y: 500 } },
    ]);
    const [selectedNode, setSelectedNode] = useState<any>(null);

    return (
        <div className="page-container animate-in" style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Sales Flow Builder</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Visually construct routing logic, AI decision nodes, and fallback menus.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" style={{ gap: 8, height: 38 }}><Play size={14} /> Simulate Flow</button>
                    <button className="btn btn-secondary" style={{ gap: 8, height: 38 }}><FileJson size={14} /> Export JSON</button>
                    <button className="btn btn-primary" style={{ gap: 8, height: 38 }}><Save size={14} /> Publish Flow</button>
                </div>
            </div>

            <div className="card" style={{ flex: 1, padding: 0, display: 'flex', overflow: 'hidden', border: '1px solid var(--border)' }}>

                {/* Left Sidebar Tools */}
                <div style={{ width: 260, borderRight: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700 }}>Node Library</h3>
                    </div>

                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Triggers</div>

                        <div className="card" style={{ padding: '10px 14px', cursor: 'grab', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)' }}>
                            <div style={{ background: 'rgba(59,130,246,0.1)', padding: 6, borderRadius: 6 }}><PhoneCall size={16} color="#3b82f6" /></div>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Inbound Call</span>
                        </div>
                        <div className="card" style={{ padding: '10px 14px', cursor: 'grab', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)' }}>
                            <div style={{ background: 'rgba(16,185,129,0.1)', padding: 6, borderRadius: 6 }}><MessageSquare size={16} color="#10b981" /></div>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Inbound Chat</span>
                        </div>

                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 12 }}>Logic & AI</div>

                        <div className="card" style={{ padding: '10px 14px', cursor: 'grab', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)' }}>
                            <div style={{ background: 'rgba(139,92,246,0.1)', padding: 6, borderRadius: 6 }}><Zap size={16} color="#8b5cf6" /></div>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>AI Sales Brain</span>
                        </div>
                        <div className="card" style={{ padding: '10px 14px', cursor: 'grab', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)' }}>
                            <div style={{ background: 'rgba(245,158,11,0.1)', padding: 6, borderRadius: 6 }}><Network size={16} color="#f59e0b" /></div>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Conditional Branch</span>
                        </div>

                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 12 }}>Actions</div>

                        <div className="card" style={{ padding: '10px 14px', cursor: 'grab', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)' }}>
                            <div style={{ background: 'rgba(239,68,68,0.1)', padding: 6, borderRadius: 6 }}><AlertTriangle size={16} color="#ef4444" /></div>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Human Escalation</span>
                        </div>
                    </div>
                </div>

                {/* Canvas Area (Interactive visual graph) */}
                <div style={{ flex: 1, background: '#0b101a', position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}>

                    {/* SVG Connector layer */}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                        <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border)" />
                            </marker>
                        </defs>
                        {/* Dynamic connections based on node positions (simplified for now) */}
                        <path d="M 520 200 L 520 300" stroke="var(--accent)" strokeWidth="2" fill="none" opacity="0.4" markerEnd="url(#arrow)" />
                        <path d="M 520 400 L 320 500" stroke="var(--border)" strokeWidth="1.5" fill="none" opacity="0.3" strokeDasharray="4 4" />
                        <path d="M 520 400 L 720 500" stroke="var(--border)" strokeWidth="1.5" fill="none" opacity="0.3" strokeDasharray="4 4" />
                    </svg>

                    {/* Nodes Rendering */}
                    {nodes.map(node => (
                        <div
                            key={node.id}
                            onClick={() => setSelectedNode(node)}
                            style={{
                                position: 'absolute', top: node.position.y, left: node.position.x,
                                width: 240, background: 'var(--bg-card)',
                                border: selectedNode?.id === node.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                                borderRadius: 16, boxShadow: selectedNode?.id === node.id ? '0 0 30px -10px var(--accent)' : '0 10px 30px -10px rgba(0,0,0,0.5)',
                                zIndex: 10, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: selectedNode?.id === node.id ? 'scale(1.02)' : 'scale(1)',
                            }}
                        >
                            <div style={{
                                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                                background: node.type === 'trigger' ? 'rgba(59,130,246,0.05)' : node.type === 'brain' ? 'rgba(139,92,246,0.05)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                borderTopLeftRadius: 16, borderTopRightRadius: 16
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {node.type === 'trigger' ? <PhoneCall size={14} color="#3b82f6" /> : node.type === 'brain' ? <Zap size={14} color="#8b5cf6" /> : <Settings2 size={14} color="var(--success)" />}
                                    <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em' }}>{node.data.label}</span>
                                </div>
                                <GripHorizontal size={14} color="var(--text-muted)" />
                            </div>
                            <div style={{ padding: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                                {node.type === 'trigger' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Channel</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{node.data.value}</span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Efficiency</span>
                                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>98%</span>
                                        </div>
                                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                                            <div style={{ width: '98%', height: '100%', background: 'var(--success)', borderRadius: 2 }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Floating Node Editor */}
                    {selectedNode && (
                        <div className="animate-in-right" style={{
                            position: 'absolute', top: 16, right: 16, width: 320,
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 20, boxShadow: '0 20px 50px -12px rgba(0,0,0,0.5)',
                            zIndex: 100, overflow: 'hidden', backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: 15, fontWeight: 800 }}>Node Settings</h3>
                                <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><ChevronRight size={18} /></button>
                            </div>
                            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Label</label>
                                    <input className="input" value={selectedNode.data.label} onChange={() => { }} />
                                </div>
                                {selectedNode.type === 'brain' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>AI Strategy (Prompt)</label>
                                        <select className="input">
                                            <option>Uzbekistan Sales SDR</option>
                                            <option>Support Specialist</option>
                                            <option>Lead Qualification</option>
                                        </select>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                                    <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSelectedNode(null)}>Close</button>
                                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save</button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

