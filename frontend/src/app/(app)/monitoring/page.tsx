'use client';

import { useState } from 'react';
import {
    Search, Filter, Play, MessageSquare, Headphones, Star, AlertTriangle,
    CheckCircle, ChevronRight, User, Bot, Clock, Calendar, ShieldCheck,
    BarChart3, Brain, Flag
} from 'lucide-react';

export default function MonitoringPage() {
    const [selected, setSelected] = useState<any | null>(null);
    const [filter, setFilter] = useState('all');
    const [interactions, setInteractions] = useState<any[]>([]);

    return (
        <div className="page-container animate-in" style={{ padding: '28px 36px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Quality Monitoring (QA)</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Review AI interactions and audit transcript accuracy for Uzbekistan sales flows</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '4px' }}>
                        {['all', 'voice', 'chat', 'flagged'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '6px 16px', border: 'none', background: filter === f ? 'var(--bg-elevated)' : 'transparent',
                                    color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
                                    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: filter === f ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: 24, flex: 1, minHeight: 0 }}>
                {/* List */}
                <div className="card" style={{ padding: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', gap: 12 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="input" placeholder="Search interactions..." style={{ paddingLeft: 34, height: 36, fontSize: 13 }} />
                        </div>
                        <button className="btn btn-secondary" style={{ height: 36, padding: '0 12px' }}><Filter size={14} /></button>
                    </div>

                    <div style={{ flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                                    <th style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Lead / Date</th>
                                    <th style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Channel</th>
                                    <th style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>AI Grade</th>
                                    <th style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Objections</th>
                                    <th style={{ padding: '14px 20px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {interactions.map(int => (
                                    <tr
                                        key={int.id}
                                        onClick={() => setSelected(int)}
                                        style={{
                                            borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s',
                                            background: selected?.id === int.id ? 'rgba(59,130,246,0.05)' : 'transparent'
                                        }}
                                        className="hover-row"
                                    >
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{int.lead_name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Calendar size={10} /> {int.date}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                                {int.channel === 'voice' ? <Headphones size={14} color="var(--accent)" /> : <MessageSquare size={14} color="var(--success)" />}
                                                {int.channel === 'voice' ? 'Phone Call' : 'Telegram'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: int.grade > 70 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: int.grade > 70 ? 'var(--success)' : 'var(--danger)', border: `2px solid ${int.grade > 70 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                                                    {int.grade}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            {int.objections?.map((obj: string) => (
                                                <span key={obj} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{obj}</span>
                                            ))}
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                            <ChevronRight size={16} color="var(--text-muted)" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Panel */}
                {selected ? (
                    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{selected.lead_name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Clock size={12} /> {selected.duration || 'N/A duration'} Session
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-secondary" style={{ padding: '8px' }} title="Flag for review"><Flag size={14} /></button>
                                    <button className="btn btn-primary" style={{ padding: '8px 16px', gap: 6 }}>
                                        <ShieldCheck size={14} /> Approve
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>AI Accuracy</div>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: selected.grade > 70 ? 'var(--success)' : 'var(--danger)' }}>{selected.grade}%</div>
                                </div>
                                <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Sentiment</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', textTransform: 'capitalize' }}>{selected.sentiment}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg-main)' }}>
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Brain size={14} /> AI Interaction Summary
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, padding: 14, background: 'var(--bg-card)', borderRadius: 12, borderLeft: '3px solid var(--accent)' }}>
                                    {selected.summary}
                                </div>
                            </div>

                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>CONVERSATION TRANSCRIPT</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {selected.transcript.map((t: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', flexDirection: t.role === 'assistant' ? 'row' : 'row-reverse', gap: 12, alignItems: 'flex-start' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.role === 'assistant' ? 'var(--accent)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                                            {t.role === 'assistant' ? <Bot size={16} color="white" /> : <User size={16} color="var(--text-secondary)" />}
                                        </div>
                                        <div style={{
                                            maxWidth: '80%', padding: '12px 16px', borderRadius: 16, fontSize: 13, lineHeight: 1.5,
                                            background: t.role === 'assistant' ? 'var(--bg-card)' : 'var(--accent)',
                                            color: t.role === 'assistant' ? 'var(--text-primary)' : 'white',
                                            border: t.role === 'assistant' ? '1px solid var(--border)' : 'none',
                                            borderTopLeftRadius: t.role === 'assistant' ? 4 : 16,
                                            borderTopRightRadius: t.role === 'assistant' ? 16 : 4
                                        }}>
                                            {t.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selected.channel === 'voice' && (
                            <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <Play size={20} fill="white" />
                                    </button>
                                    <div style={{ flex: 1, height: 24, position: 'relative' }}>
                                        {/* Mock waveform */}
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                                            {Array.from({ length: 40 }).map((_, i) => (
                                                <div key={i} style={{ flex: 1, minWidth: 2, height: `${20 + Math.random() * 60}%`, background: 'var(--accent)', opacity: 0.3, borderRadius: 1 }} />
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>02:45</div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', gap: 16 }}>
                        <BarChart3 size={64} style={{ opacity: 0.1 }} />
                        <div style={{ fontSize: 16, fontWeight: 600 }}>Select an interaction to review</div>
                    </div>
                )}
            </div>
        </div>
    );
}
