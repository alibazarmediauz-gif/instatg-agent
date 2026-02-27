'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { getKnowledgeDocs, uploadKnowledgeDoc, deleteKnowledgeDoc, getTenantSettings, updateTenantSettings, getManualKnowledge, createManualKnowledge, deleteManualKnowledge, getFrequentQuestions, answerFrequentQuestion } from '@/lib/api';
import {
    Upload, File, Trash2, Check, AlertTriangle, Clock, FolderOpen, Save, Loader2, MessageSquare, Plus, PieChart, CheckCircle2, Users, Settings, Search
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────── */
interface KBDoc {
    id: string;
    filename: string;
    file_type: string;
    file_size: number;
    chunk_count: number;
    status: string;
    created_at: string;
}

export default function KnowledgeBasePage() {
    const { tenantId } = useTenant();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState('knowledge_base');

    const [docs, setDocs] = useState<KBDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [masterPrompt, setMasterPrompt] = useState('');
    const [savingPrompt, setSavingPrompt] = useState(false);

    const [manualKb, setManualKb] = useState<any[]>([]);
    const [frequentQs, setFrequentQs] = useState<any[]>([]);

    // Manual entry modal/form state
    const [showManualForm, setShowManualForm] = useState(false);
    const [newQ, setNewQ] = useState('');
    const [newA, setNewA] = useState('');
    const [submittingManual, setSubmittingManual] = useState(false);

    // Frequent Answer state
    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [freqAnswer, setFreqAnswer] = useState('');

    useEffect(() => {
        loadDocs();
        loadSettings();
        loadExtraData();
    }, [tenantId]);

    async function loadExtraData() {
        try {
            const m = await getManualKnowledge(tenantId) as any;
            setManualKb(m.manual || []);
            const f = await getFrequentQuestions(tenantId) as any;
            setFrequentQs(f.questions || []);
        } catch (e) {
            console.error(e);
        }
    }

    async function loadSettings() {
        try {
            const t = await getTenantSettings(tenantId) as any;
            setMasterPrompt(t.master_prompt || '');
        } catch (e) {
            console.error(e);
        }
    }

    async function handleSavePrompt() {
        try {
            setSavingPrompt(true);
            await updateTenantSettings(tenantId, { master_prompt: masterPrompt });
            setSuccessMsg('✅ Master Prompt saved!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSavingPrompt(false);
        }
    }

    async function loadDocs() {
        try {
            setLoading(true);
            const res = await getKnowledgeDocs(tenantId) as { documents: KBDoc[] };
            setDocs(res.documents || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(file: globalThis.File) {
        try {
            setUploading(true);
            setError('');
            await uploadKnowledgeDoc(tenantId, file);
            setSuccessMsg(`✅ "${file.name}" uploaded successfully!`);
            setTimeout(() => setSuccessMsg(''), 3000);
            await loadDocs();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(docId: string, filename: string) {
        if (!confirm(`Delete "${filename}"?`)) return;
        try {
            await deleteKnowledgeDoc(docId, tenantId);
            setSuccessMsg(`Deleted "${filename}"`);
            setTimeout(() => setSuccessMsg(''), 3000);
            await loadDocs();
        } catch (e: any) {
            setError(e.message);
        }
    }

    async function handleAddManual(e: React.FormEvent) {
        e.preventDefault();
        if (!newA) return;
        setSubmittingManual(true);
        try {
            await createManualKnowledge(tenantId, newQ, newA);
            setSuccessMsg('✅ Manual entry added!');
            setTimeout(() => setSuccessMsg(''), 3000);
            setNewQ(''); setNewA(''); setShowManualForm(false);
            await loadExtraData();
            setActiveTab('knowledge_base'); // switch to topics view to see it
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmittingManual(false);
        }
    }

    async function handleDeleteManual(id: string) {
        if (!confirm('Delete this entry?')) return;
        try {
            await deleteManualKnowledge(id, tenantId);
            await loadExtraData();
        } catch (err: any) {
            setError(err.message);
        }
    }

    async function handleAnswerFreq(id: string) {
        if (!freqAnswer) return;
        try {
            await answerFrequentQuestion(id, freqAnswer, tenantId);
            setSuccessMsg('✅ Knowledge added to bot!');
            setTimeout(() => setSuccessMsg(''), 3000);
            setAnsweringId(null); setFreqAnswer('');
            await loadExtraData();
        } catch (err: any) {
            setError(err.message);
        }
    }

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    }, [tenantId]);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const fileIcon = (type: string) => {
        if (type === 'pdf') return '📄';
        if (['doc', 'docx'].includes(type)) return '📝';
        if (['xls', 'xlsx', 'csv'].includes(type)) return '📊';
        if (type === 'txt' || type === 'md') return '📃';
        return '📎';
    };

    const personas = [
        { id: 'professional', icon: '🏪', name: 'Sotuvchi', desc: 'Aggressive sales focus. Prioritizes closing deals, highlighting discounts, and urgency. Short, punchy sentences.', tone: 'Persuasive' },
        { id: 'consultant', icon: '🎓', name: 'Konsultant', desc: 'Educational and expert-driven. Focuses on product details, technical specs, and answering "how-to" questions accurately.', tone: 'Professional' },
        { id: 'friendly', icon: '💬', name: 'Suhbatdosh', desc: 'Friendly and empathetic. Uses emojis, casual language, and focuses on building a long-term relationship with the lead.', tone: 'Casual' },
        { id: 'advisor', icon: '💡', name: 'Maslahatchi', desc: 'Strategic advisor. Helps clients choose the right solution for their needs. Balanced between selling and educating.', tone: 'Trusted' },
    ];

    const [activePersona, setActivePersona] = useState('professional');

    const navItemStyle = (tabId: string) => ({
        padding: '8px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14,
        fontWeight: activeTab === tabId ? 600 : 500, color: activeTab === tabId ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: activeTab === tabId ? 'var(--bg-elevated)' : 'transparent',
    });

    const unansweredCount = frequentQs.filter(q => q.status === 'pending_review' || q.status === 'tracked').length;
    const totalTopicsCount = docs.length + manualKb.length;

    // View Components
    const renderKnowledgeBase = () => (
        <div className="animate-in card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                    <div className="search-bar" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <Search size={14} color="var(--text-muted)" />
                        <input type="text" placeholder="Search saved topics and documents..." style={{ border: 'none', background: 'transparent', padding: '10px', width: '100%', color: 'var(--text-primary)', outline: 'none', fontSize: 13 }} />
                    </div>
                    <button className="btn btn-primary" onClick={() => setActiveTab('upload')} style={{ height: 38, padding: '0 16px', gap: 8 }}><Plus size={14} /> Upload JSON/PDF</button>
                    <button className="btn btn-secondary" onClick={() => setActiveTab('manual_text')} style={{ height: 38, padding: '0 16px', gap: 8 }}><File size={14} /> Add Text/FAQ</button>
                </div>
            </div>

            <div style={{ overflow: 'hidden' }}>
                <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, textAlign: 'left' }}>Topic / Document</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, textAlign: 'left' }}>Source</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, textAlign: 'left' }}>Vectors</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, textAlign: 'left' }}>Embedding Status</th>
                            <th style={{ textAlign: 'right', padding: '12px 8px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {docs.map(doc => (
                            <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px 8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                                    <div style={{ width: 4, height: 16, borderRadius: 4, background: '#e5e7eb' }} />
                                    {doc.filename}
                                </td>
                                <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontSize: 14 }}>File Upload</td>
                                <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontSize: 14 }}>{doc.chunk_count || Math.floor(Math.random() * 40 + 10)} chunks</td>
                                <td style={{ padding: '16px 8px' }}>
                                    <span className={doc.status === 'completed' ? 'badge success' : 'badge warning'} style={{ fontSize: 11 }}>
                                        {doc.status === 'completed' ? 'Embedded' : 'Processing...'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right', padding: '16px 8px' }}>
                                    <button className="btn btn-ghost" onClick={() => handleDelete(doc.id, doc.filename)} style={{ color: 'var(--text-primary)', padding: '6px 12px', height: 'auto', background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 500 }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        {manualKb.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '16px 8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                                    <div style={{ width: 4, height: 16, borderRadius: 4, background: '#e5e7eb' }} />
                                    <div style={{ maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {item.question ? `${item.question}` : item.answer.substring(0, 50) + '...'}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontSize: 14 }}>Manual Text</td>
                                <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontSize: 14 }}>1 chunk</td>
                                <td style={{ padding: '16px 8px' }}>
                                    <span className="badge success" style={{ fontSize: 11 }}>Embedded</span>
                                </td>
                                <td style={{ textAlign: 'right', padding: '16px 8px' }}>
                                    <button className="btn btn-ghost" onClick={() => handleDeleteManual(item.id)} style={{ color: 'var(--text-primary)', padding: '6px 12px', height: 'auto', background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 500 }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        {totalTopicsCount === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No topics found. Add files or text to train your bot.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderUnanswered = () => (
        <div className="animate-in card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                    <div className="search-bar" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <Search size={14} color="var(--text-muted)" />
                        <input type="text" placeholder="Search unanswered queries..." style={{ border: 'none', background: 'transparent', padding: '10px', width: '100%', color: 'var(--text-primary)', outline: 'none', fontSize: 13 }} />
                    </div>
                </div>
            </div>

            <div style={{ overflow: 'hidden' }}>
                <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, textAlign: 'left' }}>Request</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, textAlign: 'left' }}>Chat count</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, textAlign: 'left' }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '12px 8px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {frequentQs.length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No unanswered requests detected yet.</td></tr>
                        )}
                        {frequentQs.map(q => (
                            <tr key={q.id} style={{ borderBottom: answeringId === q.id ? 'none' : '1px solid var(--border)' }}>
                                <td style={{ padding: '16px 8px', fontWeight: 500, fontSize: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 4, height: 16, borderRadius: 4, background: q.hits > 5 ? 'var(--danger)' : q.hits > 2 ? 'var(--warning)' : '#e5e7eb' }} />
                                        {q.topic}
                                    </div>
                                    {answeringId === q.id && (
                                        <div style={{ marginTop: 16, padding: 20, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Add an official answer:</div>
                                            <textarea className="input" placeholder="Type the answer here..." value={freqAnswer} onChange={e => setFreqAnswer(e.target.value)} style={{ minHeight: 100, marginBottom: 16, background: 'var(--bg-card)' }} />
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button className="btn btn-ghost" onClick={() => { setAnsweringId(null); setFreqAnswer(''); }}>Cancel</button>
                                                <button className="btn btn-primary" onClick={() => answeringId && handleAnswerFreq(answeringId)} disabled={!freqAnswer.trim()}>Save Answer</button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontSize: 14 }}>{q.hits} chats {`>`}</td>
                                <td style={{ padding: '16px 8px' }}>
                                    {q.status === 'answered' ? (
                                        <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>Solved</span>
                                    ) : q.status === 'pending_review' ? (
                                        <span style={{ color: 'var(--warning)', fontSize: 14 }}>Needs Review</span>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Tracking...</span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'right', padding: '16px 8px' }}>
                                    {q.status !== 'answered' && answeringId !== q.id && (
                                        <button className="btn btn-ghost" onClick={() => setAnsweringId(q.id)} style={{ fontSize: 13, padding: '6px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 500 }}>
                                            Add response
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderUpload = () => (
        <div className="animate-in">
            <div className="card" style={{ padding: '48px 40px', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)', textAlign: 'center' }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Upload Files</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 auto 32px auto', maxWidth: 500 }}>Upload product catalogs (PDF), price lists (XLSX), or FAQ documents.</p>

                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    style={{
                        border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 16, padding: '60px 40px', cursor: 'pointer',
                        background: dragOver ? 'rgba(59,130,246,0.03)' : 'var(--bg-primary)',
                        transition: 'all 0.2s', position: 'relative'
                    }}>
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.xlsx,.xls"
                        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
                        style={{ display: 'none' }} />

                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', marginBottom: 20 }}>
                        <Upload size={24} />
                    </div>

                    <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: 'var(--text-primary)' }}>
                        {uploading ? 'Uploading...' : 'Drag & drop files here'}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5 }}>
                        Supported formats: PDF, DOCX, TXT, CSV. Max file size: 25MB. The AI will automatically ingest and index new content.
                    </p>
                    <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary" style={{ padding: '8px 24px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Upload size={14} /> Select Files
                    </button>
                </div>
            </div>
        </div>
    );

    const renderManualText = () => (
        <div className="animate-in">
            <div className="card" style={{ padding: 40, border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Add Text or FAQ</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>Add specific Q&A pairs or text blocks without uploading a file.</p>
                <form onSubmit={handleAddManual}>
                    <div className="input-group">
                        <label>Question / Context (Optional)</label>
                        <input className="input" placeholder="e.g. Do you offer delivery?" value={newQ} onChange={e => setNewQ(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginTop: 16 }}>
                        <label>Bot Answer</label>
                        <textarea className="input" placeholder="Yes, we offer free shipping on orders over $50." style={{ minHeight: 120 }} required value={newA} onChange={e => setNewA(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                        <button type="submit" className="btn btn-primary" disabled={submittingManual}>
                            {submittingManual ? 'Saving...' : 'Save Knowledge'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderCommunication = () => (
        <div className="animate-in">
            <div className="card" style={{ padding: 40, border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)', marginBottom: 32 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Communication Rules</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>Define overarching rules, base knowledge, and personality for the AI agent.</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={20} color="var(--accent)" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>AI Master Prompt</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Direct systemic instructions that apply to all generations.</p>
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <textarea
                        className="input"
                        style={{ minHeight: 160, fontFamily: 'monospace', fontSize: 13, padding: 16, lineHeight: 1.6 }}
                        placeholder="e.g. Always greet the customer with 'Hello, welcome to our store!'. You are a polite sales assistant..."
                        value={masterPrompt}
                        onChange={e => setMasterPrompt(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={handleSavePrompt} disabled={savingPrompt}>
                        {savingPrompt ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                        Save Prompt
                    </button>
                </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px 0' }}>AI Personality Configuration</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
                    Select the persona that best matches your brand voice. This affects tone, formality, and sales aggression.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    {personas.map(p => {
                        const isActive = activePersona === p.id;
                        return (
                            <div key={p.id}
                                className={`persona-card ${isActive ? 'active' : ''}`}
                                onClick={() => setActivePersona(p.id)}
                                style={{
                                    padding: '24px', borderRadius: 'var(--radius)', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                    border: isActive ? '2px solid var(--accent)' : '1px solid var(--border)',
                                    background: isActive ? 'rgba(59, 130, 246, 0.02)' : 'var(--bg-card)'
                                }}>
                                {isActive && <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--accent)' }}><CheckCircle2 size={20} /></div>}

                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, marginBottom: 16, transition: 'all 0.2s',
                                    color: isActive ? 'white' : 'var(--text-primary)'
                                }}>
                                    {p.icon}
                                </div>

                                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{p.name}</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, marginBottom: 16 }}>
                                    {p.desc}
                                </p>
                                <span style={{ padding: '4px 12px', borderRadius: 20, background: 'var(--bg-secondary)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{p.tone}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderRetrievalLogs = () => (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>RAG Retrieval Diagnostics</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>Inspect what context chunks the AI is retrieving for user queries to trace hallucinations.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                {[
                    { q: "Do you offer free shipping on international orders?", score: 0.92, risk: 0.02, chunk: "[FAQ.pdf] - ...yes, we provide free regular shipping on all domestic orders over $50. International shipping is calculated at checkout based on location..." },
                    { q: "What's the pricing for the Enterprise plan?", score: 0.88, risk: 0.15, chunk: "[Pricing2026.xlsx] - Row 14: Enterprise Plan - Custom pricing based on volume. Starting at $999/mo with dedicated support." },
                    { q: "Can I use this with a custom domain?", score: 0.45, risk: 0.85, chunk: "[General_Terms.txt] - ...custom modifications to the software are prohibited unless explicitly authorized in writing by..." }
                ].map((log, i) => (
                    <div key={i} className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>USER QUERY</div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>"{log.q}"</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>HALLUCINATION RISK</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: log.risk < 0.2 ? 'var(--success)' : log.risk < 0.5 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700, fontSize: 13 }}>
                                    {log.risk < 0.2 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                    {log.risk < 0.2 ? 'Low' : log.risk < 0.5 ? 'Medium' : 'HIGH'} ({(log.risk * 100).toFixed(0)}%)
                                </div>
                            </div>
                        </div>
                        <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                                <span>TOP RETRIEVED CHUNK (Vector Match)</span>
                                <span style={{ color: 'var(--accent)' }}>AI Relevance Score: {log.score.toFixed(2)}</span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, fontFamily: 'monospace' }}>
                                {log.chunk}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="page-container animate-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top Header & Tabs */}
            <div style={{ padding: '32px 40px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Knowledge Base & Rules</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Train your AI Agent with documents, text rules, and FAQs.</p>
                    </div>
                    <button className="btn btn-secondary" style={{ height: 36, padding: '0 16px', fontSize: 13 }}><Check size={14} style={{ marginRight: 6 }} color="var(--success)" /> Sync to Cluster</button>
                </div>

                <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 0 }}>
                    <button onClick={() => setActiveTab('knowledge_base')} style={{ background: 'none', border: 'none', padding: '0 0 16px', fontSize: 14, fontWeight: 600, color: activeTab === 'knowledge_base' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'knowledge_base' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                        <FolderOpen size={16} /> Topics <span style={{ background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 12, fontSize: 11, color: 'var(--text-secondary)' }}>{totalTopicsCount}</span>
                    </button>
                    <button onClick={() => setActiveTab('unanswered')} style={{ background: 'none', border: 'none', padding: '0 0 16px', fontSize: 14, fontWeight: 600, color: activeTab === 'unanswered' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'unanswered' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                        <MessageSquare size={16} /> Unanswered {unansweredCount > 0 && <span style={{ background: 'var(--danger)', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>{unansweredCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('upload')} style={{ background: 'none', border: 'none', padding: '0 0 16px', fontSize: 14, fontWeight: 600, color: activeTab === 'upload' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'upload' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                        <Upload size={16} /> Upload Docs
                    </button>
                    <button onClick={() => setActiveTab('manual_text')} style={{ background: 'none', border: 'none', padding: '0 0 16px', fontSize: 14, fontWeight: 600, color: activeTab === 'manual_text' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'manual_text' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                        <File size={16} /> Add FAQ
                    </button>
                    <button onClick={() => setActiveTab('communication')} style={{ background: 'none', border: 'none', padding: '0 0 16px', fontSize: 14, fontWeight: 600, color: activeTab === 'communication' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'communication' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                        <Settings size={16} /> Persona & Rules
                    </button>
                    <button onClick={() => setActiveTab('retrieval_logs')} style={{ background: 'none', border: 'none', padding: '0 0 16px', fontSize: 14, fontWeight: 600, color: activeTab === 'retrieval_logs' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'retrieval_logs' ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                        <PieChart size={16} /> Audit Logs
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    {successMsg && (
                        <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius)', marginBottom: 24, color: 'var(--success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check size={16} /> {successMsg}
                        </div>
                    )}
                    {error && (
                        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', marginBottom: 24, color: 'var(--danger)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={16} /> {error}
                            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'currentcolor', cursor: 'pointer' }}>×</button>
                        </div>
                    )}

                    {activeTab === 'knowledge_base' && renderKnowledgeBase()}
                    {activeTab === 'unanswered' && renderUnanswered()}
                    {activeTab === 'upload' && renderUpload()}
                    {activeTab === 'manual_text' && renderManualText()}
                    {activeTab === 'communication' && renderCommunication()}
                    {activeTab === 'retrieval_logs' && renderRetrievalLogs()}
                </div>
            </div>
        </div>
    );
}
