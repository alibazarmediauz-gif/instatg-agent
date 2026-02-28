'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { getKnowledgeDocs, uploadKnowledgeDoc, deleteKnowledgeDoc, getTenantSettings, updateTenantSettings, getManualKnowledge, createManualKnowledge, deleteManualKnowledge, getFrequentQuestions, answerFrequentQuestion } from '@/lib/api';
import {
    Upload, File, Trash2, Check, AlertTriangle, Clock, FolderOpen, Save, Loader2, MessageSquare, Plus, PieChart, CheckCircle2, Users, Settings, Search, ArrowRight, ArrowLeft, Sparkles, Bot, Zap, Globe, Instagram, Facebook, Send, Star, Building2, ShoppingBag, GraduationCap, Home, UtensilsCrossed, Stethoscope, ChevronRight
} from 'lucide-react';

/* ─── Types ─── */
interface KBDoc { id: string; filename: string; file_type: string; file_size: number; chunk_count: number; status: string; created_at: string; }

interface AgentTemplate {
    id: string; icon: string; name: string; desc: string; color: string;
    businessInfo: Partial<BusinessInfo>; persona: string; masterPrompt: string;
}

interface BusinessInfo {
    businessName: string; industry: string; products: string; workingHours: string;
    location: string; contactPhone: string; contactEmail: string;
    languages: string[]; paymentMethods: string[];
}

const TEMPLATES: AgentTemplate[] = [
    {
        id: 'ecommerce', icon: '🛍️', name: 'Savdo Agenti', desc: 'Mahsulot so\'rovlari, narxlar, buyurtmalar va yetkazib berish uchun', color: '#3B82F6',
        businessInfo: { industry: 'E-commerce / Online savdo' }, persona: 'professional',
        masterPrompt: 'Siz professional savdo agentisiz. Mijozlarga mahsulotlar haqida ma\'lumot bering, narxlarni ayting, buyurtma rasmiylashtiring. Doimo xushmuomala va yordamga tayyor bo\'ling.'
    },
    {
        id: 'clinic', icon: '🏥', name: 'Klinika Agenti', desc: 'Qabulga yozilish, shifokorlar, xizmatlar haqida ma\'lumot', color: '#10B981',
        businessInfo: { industry: 'Tibbiyot / Klinika' }, persona: 'consultant',
        masterPrompt: 'Siz tibbiy klinika yordamchisisiz. Bemorlarni qabulga yozing, shifokorlar haqida ma\'lumot bering, xizmatlar narxini ayting. Tibbiy maslahat bermang.'
    },
    {
        id: 'realestate', icon: '🏠', name: 'Ko\'chmas mulk Agenti', desc: 'Kvartiralar, uylar, narxlar va ko\'rishga yozilish', color: '#8B5CF6',
        businessInfo: { industry: 'Ko\'chmas mulk' }, persona: 'advisor',
        masterPrompt: 'Siz ko\'chmas mulk agentisiz. Mijozlarga uy va kvartiralar haqida ma\'lumot bering, ko\'rishga vaqt belgilang, narxlar va shartlarni tushuntiring.'
    },
    {
        id: 'education', icon: '🎓', name: 'Ta\'lim Agenti', desc: 'Kurslar, o\'quv dasturlari, ro\'yxatdan o\'tish', color: '#F59E0B',
        businessInfo: { industry: 'Ta\'lim / Kurslar' }, persona: 'consultant',
        masterPrompt: 'Siz ta\'lim markazi yordamchisisiz. Kurslar, o\'qituvchilar, dars jadvali, narxlar haqida ma\'lumot bering. Ro\'yxatdan o\'tishga yordam bering.'
    },
    {
        id: 'restaurant', icon: '🍕', name: 'Restoran Agenti', desc: 'Menyu, buyurtma, yetkazib berish va band qilish', color: '#EF4444',
        businessInfo: { industry: 'Restoran / Yetkazib berish' }, persona: 'friendly',
        masterPrompt: 'Siz restoran yordamchisisiz. Menyu haqida ayting, buyurtma qabul qiling, yetkazib berish vaqtini bildiring. Do\'stona va tezkor javob bering.'
    },
    {
        id: 'custom', icon: '✨', name: 'Maxsus Agent', desc: 'Noldan o\'zingiz yarating — to\'liq nazorat', color: '#6366F1',
        businessInfo: {}, persona: 'professional',
        masterPrompt: ''
    },
];

const PERSONAS = [
    { id: 'professional', icon: '🏪', name: 'Sotuvchi', desc: 'Sotishga yo\'naltirilgan. Chegirmalar, shoshilinchlik, qisqa gaplar.', tone: 'Ishontiruvchi' },
    { id: 'consultant', icon: '🎓', name: 'Konsultant', desc: 'Ekspert yondashuv. Texnik tafsilotlar va "qanday qilish" javoblari.', tone: 'Professional' },
    { id: 'friendly', icon: '💬', name: 'Suhbatdosh', desc: 'Do\'stona va empatik. Emoji, sodda til, uzoq muddatli munosabat.', tone: 'Samimiy' },
    { id: 'advisor', icon: '💡', name: 'Maslahatchi', desc: 'Strategik yordam. Mijozga to\'g\'ri yechim topishga yordam beradi.', tone: 'Ishonchli' },
];

const STEP_LABELS = ['Shablon', 'Biznes', 'Shaxsiyat', 'Bilim bazasi', 'Platformalar', 'Tekshirish'];

export default function KnowledgeBasePage() {
    const { tenantId } = useTenant();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Wizard state
    const [step, setStep] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [agentActivated, setAgentActivated] = useState(false);

    // Business info
    const [biz, setBiz] = useState<BusinessInfo>({
        businessName: '', industry: '', products: '', workingHours: '09:00 - 18:00',
        location: '', contactPhone: '', contactEmail: '',
        languages: ['uz'], paymentMethods: [],
    });

    // Agent config
    const [activePersona, setActivePersona] = useState('professional');
    const [masterPrompt, setMasterPrompt] = useState('');
    const [greeting, setGreeting] = useState('Assalomu alaykum! Sizga qanday yordam bera olaman? 😊');

    // KB state
    const [docs, setDocs] = useState<KBDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [manualKb, setManualKb] = useState<any[]>([]);
    const [newQ, setNewQ] = useState('');
    const [newA, setNewA] = useState('');
    const [submittingManual, setSubmittingManual] = useState(false);
    const [savingAll, setSavingAll] = useState(false);

    // Manage mode tabs
    const [manageTab, setManageTab] = useState('topics');
    const [frequentQs, setFrequentQs] = useState<any[]>([]);
    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [freqAnswer, setFreqAnswer] = useState('');
    const [savingPrompt, setSavingPrompt] = useState(false);

    useEffect(() => { loadDocs(); loadSettings(); loadExtraData(); }, [tenantId]);

    async function loadExtraData() {
        try {
            const m = await getManualKnowledge(tenantId) as any;
            setManualKb(m.manual || []);
            const f = await getFrequentQuestions(tenantId) as any;
            setFrequentQs(f.questions || []);
        } catch (e) { console.error(e); }
    }

    async function loadSettings() {
        try {
            const t = await getTenantSettings(tenantId) as any;
            if (t.master_prompt) { setMasterPrompt(t.master_prompt); setAgentActivated(true); }
        } catch (e) { console.error(e); }
    }

    async function loadDocs() {
        try { setLoading(true); const res = await getKnowledgeDocs(tenantId) as { documents: KBDoc[] }; setDocs(res.documents || []); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    }

    async function handleUpload(file: globalThis.File) {
        try { setUploading(true); setError(''); await uploadKnowledgeDoc(tenantId, file); setSuccessMsg(`✅ "${file.name}" yuklandi!`); setTimeout(() => setSuccessMsg(''), 3000); await loadDocs(); } catch (e: any) { setError(e.message); } finally { setUploading(false); }
    }

    async function handleDelete(docId: string, filename: string) {
        if (!confirm(`"${filename}" o'chirilsinmi?`)) return;
        try { await deleteKnowledgeDoc(docId, tenantId); await loadDocs(); } catch (e: any) { setError(e.message); }
    }

    async function handleAddManual(e: React.FormEvent) {
        e.preventDefault(); if (!newA) return; setSubmittingManual(true);
        try { await createManualKnowledge(tenantId, newQ, newA); setSuccessMsg('✅ Qo\'shildi!'); setTimeout(() => setSuccessMsg(''), 3000); setNewQ(''); setNewA(''); await loadExtraData(); } catch (err: any) { setError(err.message); } finally { setSubmittingManual(false); }
    }

    async function handleDeleteManual(id: string) {
        if (!confirm('O\'chirilsinmi?')) return;
        try { await deleteManualKnowledge(id, tenantId); await loadExtraData(); } catch (err: any) { setError(err.message); }
    }

    async function handleSavePrompt() {
        try { setSavingPrompt(true); await updateTenantSettings(tenantId, { master_prompt: masterPrompt }); setSuccessMsg('✅ Saqlandi!'); setTimeout(() => setSuccessMsg(''), 3000); } catch (e: any) { setError(e.message); } finally { setSavingPrompt(false); }
    }

    async function handleAnswerFreq(id: string) {
        if (!freqAnswer) return;
        try { await answerFrequentQuestion(id, freqAnswer, tenantId); setSuccessMsg('✅ Javob saqlandi!'); setTimeout(() => setSuccessMsg(''), 3000); setAnsweringId(null); setFreqAnswer(''); await loadExtraData(); } catch (err: any) { setError(err.message); }
    }

    const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleUpload(file); }, [tenantId]);

    function selectTemplate(id: string) {
        setSelectedTemplate(id);
        const t = TEMPLATES.find(tpl => tpl.id === id);
        if (t) {
            setBiz(prev => ({ ...prev, ...t.businessInfo }));
            setActivePersona(t.persona);
            setMasterPrompt(t.masterPrompt);
        }
        setStep(1);
    }

    function toggleLang(lang: string) {
        setBiz(prev => ({ ...prev, languages: prev.languages.includes(lang) ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang] }));
    }

    function togglePayment(method: string) {
        setBiz(prev => ({ ...prev, paymentMethods: prev.paymentMethods.includes(method) ? prev.paymentMethods.filter(m => m !== method) : [...prev.paymentMethods, method] }));
    }

    async function handleActivate() {
        setSavingAll(true);
        try {
            const fullPrompt = `${masterPrompt}\n\n--- BIZNES MA'LUMOTLARI ---\nBiznes nomi: ${biz.businessName}\nSoha: ${biz.industry}\nMahsulotlar: ${biz.products}\nIsh vaqti: ${biz.workingHours}\nManzil: ${biz.location}\nTelefon: ${biz.contactPhone}\nEmail: ${biz.contactEmail}\nTillar: ${biz.languages.join(', ')}\nTo'lov usullari: ${biz.paymentMethods.join(', ')}\n\nSalomlash xabari: ${greeting}`;
            await updateTenantSettings(tenantId, { master_prompt: fullPrompt });
            setAgentActivated(true);
            setSuccessMsg('✅ Agent faollashtirildi!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (e: any) { setError(e.message); } finally { setSavingAll(false); }
    }

    // Card style helper
    const cs = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 } as const;
    const inputStyle = { width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none' } as const;
    const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 } as const;

    /* ─── STEP RENDERERS ─── */

    const renderStep0 = () => (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #3B82F6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Bot size={28} color="white" /></div>
                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>AI Agentingizni yarating</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>Tayyor shablondan boshlang yoki noldan o'zingiz yarating. Har birAgent biznesingiz uchun moslashtiriladi.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {TEMPLATES.map(t => (
                    <div key={t.id} onClick={() => selectTemplate(t.id)} style={{ ...cs, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                        onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = t.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                        onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                        <div style={{ width: '100%', height: 3, background: t.color, position: 'absolute', top: 0, left: 0, borderRadius: '16px 16px 0 0' }} />
                        <div style={{ fontSize: 36, marginBottom: 12, marginTop: 8 }}>{t.icon}</div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{t.name}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>{t.desc}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.color, fontSize: 13, fontWeight: 600 }}>Tanlash <ChevronRight size={14} /></div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Biznes ma'lumotlari</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Agent sizning biznesingiz haqida to'liq ma'lumotga ega bo'ladi.</p>
            <div style={{ display: 'grid', gap: 20 }}>
                <div><label style={labelStyle}>Biznes nomi *</label><input style={inputStyle} placeholder="Masalan: Green Peel Beauty" value={biz.businessName} onChange={e => setBiz({ ...biz, businessName: e.target.value })} /></div>
                <div><label style={labelStyle}>Soha / Faoliyat turi</label><input style={inputStyle} placeholder="Masalan: Go'zallik saloni" value={biz.industry} onChange={e => setBiz({ ...biz, industry: e.target.value })} /></div>
                <div><label style={labelStyle}>Mahsulotlar / Xizmatlar</label><textarea style={{ ...inputStyle, minHeight: 80 }} placeholder="Nimalar sotasiz yoki qanday xizmatlar ko'rsatasiz?" value={biz.products} onChange={e => setBiz({ ...biz, products: e.target.value })} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><label style={labelStyle}>Ish vaqti</label><input style={inputStyle} placeholder="09:00 - 18:00" value={biz.workingHours} onChange={e => setBiz({ ...biz, workingHours: e.target.value })} /></div>
                    <div><label style={labelStyle}>Manzil</label><input style={inputStyle} placeholder="Toshkent, Chilonzor" value={biz.location} onChange={e => setBiz({ ...biz, location: e.target.value })} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><label style={labelStyle}>Telefon raqam</label><input style={inputStyle} placeholder="+998 90 123 45 67" value={biz.contactPhone} onChange={e => setBiz({ ...biz, contactPhone: e.target.value })} /></div>
                    <div><label style={labelStyle}>Email</label><input style={inputStyle} placeholder="info@example.com" value={biz.contactEmail} onChange={e => setBiz({ ...biz, contactEmail: e.target.value })} /></div>
                </div>
                <div>
                    <label style={labelStyle}>Tillar</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {[['uz', '🇺🇿 O\'zbekcha'], ['ru', '🇷🇺 Ruscha'], ['en', '🇬🇧 Inglizcha']].map(([code, label]) => (
                            <button key={code} onClick={() => toggleLang(code)} style={{ padding: '8px 16px', borderRadius: 10, border: biz.languages.includes(code) ? '2px solid var(--accent)' : '1px solid var(--border)', background: biz.languages.includes(code) ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{label}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label style={labelStyle}>To'lov usullari</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {['Naqd', 'Karta (Click)', 'Karta (Payme)', 'Bank o\'tkazmasi', 'Kriptovalyuta'].map(m => (
                            <button key={m} onClick={() => togglePayment(m)} style={{ padding: '8px 14px', borderRadius: 10, border: biz.paymentMethods.includes(m) ? '2px solid var(--accent)' : '1px solid var(--border)', background: biz.paymentMethods.includes(m) ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>{m}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Agent shaxsiyati</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Agent qanday gaplashishini sozlang.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
                {PERSONAS.map(p => {
                    const isActive = activePersona === p.id;
                    return (
                        <div key={p.id} onClick={() => setActivePersona(p.id)} style={{ ...cs, cursor: 'pointer', border: isActive ? '2px solid var(--accent)' : '1px solid var(--border)', background: isActive ? 'rgba(59,130,246,0.03)' : 'var(--bg-card)', textAlign: 'center', position: 'relative' }}>
                            {isActive && <CheckCircle2 size={20} color="var(--accent)" style={{ position: 'absolute', top: 12, right: 12 }} />}
                            <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{p.name}</h3>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>{p.desc}</p>
                            <span style={{ padding: '4px 12px', borderRadius: 20, background: 'var(--bg-elevated)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{p.tone}</span>
                        </div>
                    );
                })}
            </div>
            <div style={{ marginBottom: 20 }}><label style={labelStyle}>Salomlash xabari</label><textarea style={{ ...inputStyle, minHeight: 80 }} value={greeting} onChange={e => setGreeting(e.target.value)} /></div>
            <div><label style={labelStyle}>Master Prompt (AI ko'rsatmalar)</label><textarea style={{ ...inputStyle, minHeight: 140, fontFamily: 'monospace', fontSize: 13 }} placeholder="Agent uchun maxsus ko'rsatmalar..." value={masterPrompt} onChange={e => setMasterPrompt(e.target.value)} /></div>
        </div>
    );

    const renderStep3 = () => (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Bilimlar bazasi</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Agentga mahsulotlar, narxlar, FAQ ma'lumotlarini kiritish.</p>
            <div style={{ ...cs, marginBottom: 24, textAlign: 'center' }} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.xlsx,.xls" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} style={{ display: 'none' }} />
                <Upload size={28} color="var(--accent)" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{uploading ? 'Yuklanmoqda...' : 'Fayllarni shu yerga tashlang'}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>PDF, DOCX, Excel, CSV — max 25MB</p>
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}><Upload size={14} /> Fayl tanlash</button>
            </div>
            {docs.length > 0 && <div style={{ ...cs, padding: 0, marginBottom: 24, overflow: 'hidden' }}>
                {docs.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><File size={16} color="var(--accent)" /><span style={{ fontSize: 14 }}>{doc.filename}</span><span className={doc.status === 'completed' ? 'badge success' : 'badge warning'} style={{ fontSize: 11 }}>{doc.status === 'completed' ? 'Tayyor' : 'Yuklanmoqda...'}</span></div>
                        <button onClick={() => handleDelete(doc.id, doc.filename)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>}
            <div style={cs}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>FAQ qo'shish</h3>
                <form onSubmit={handleAddManual} style={{ display: 'grid', gap: 12 }}>
                    <input style={inputStyle} placeholder="Savol: Yetkazib berish bormi?" value={newQ} onChange={e => setNewQ(e.target.value)} />
                    <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Javob: Ha, Toshkent bo'ylab bepul yetkazib beramiz." required value={newA} onChange={e => setNewA(e.target.value)} />
                    <button type="submit" className="btn btn-primary" disabled={submittingManual} style={{ justifySelf: 'end', padding: '8px 20px', fontSize: 13 }}>{submittingManual ? 'Saqlanmoqda...' : '+ Qo\'shish'}</button>
                </form>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Platformalar</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Agent qaysi kanallarda ishlaydi?</p>
            {[
                { name: 'Telegram', icon: <Send size={22} />, color: '#229ED9', desc: 'Telegram bot orqali', status: 'connected' },
                { name: 'Instagram', icon: <Instagram size={22} />, color: '#E4405F', desc: 'Instagram DM va commentlar', status: 'connected' },
                { name: 'Facebook Messenger', icon: <Facebook size={22} />, color: '#1877F2', desc: 'Facebook Page xabarlari', status: 'pending' },
            ].map(p => (
                <div key={p.name} style={{ ...cs, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${p.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color }}>{p.icon}</div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{p.name}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.desc}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.status === 'connected' ? <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(34,197,94,0.15)', color: '#22C55E', fontSize: 12, fontWeight: 600 }}>✓ Ulangan</span>
                            : <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>Ulash</button>}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderStep5 = () => (
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #22C55E, #10B981)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><Zap size={30} color="white" /></div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Agent tayyor!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 40 }}>Barcha sozlamalarni tekshiring va faollashtiring.</p>
            <div style={{ ...cs, textAlign: 'left', marginBottom: 24 }}>
                {[
                    ['Biznes', biz.businessName || '—'],
                    ['Soha', biz.industry || '—'],
                    ['Shaxsiyat', PERSONAS.find(p => p.id === activePersona)?.name || '—'],
                    ['Tillar', biz.languages.join(', ')],
                    ['Bilim bazasi', `${docs.length} fayl, ${manualKb.length} FAQ`],
                    ['Platformalar', 'Telegram, Instagram, Messenger'],
                ].map(([label, value]) => (
                    <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{label}</span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{value}</span>
                    </div>
                ))}
            </div>
            <button onClick={handleActivate} disabled={savingAll} className="btn btn-primary" style={{ padding: '14px 40px', fontSize: 16, fontWeight: 700, borderRadius: 14, background: 'linear-gradient(135deg, #22C55E, #10B981)' }}>
                {savingAll ? <Loader2 size={20} className="spin" /> : <Zap size={20} />} Agentni faollashtirish
            </button>
        </div>
    );

    /* ─── MANAGE MODE (after activation) ─── */
    const renderManageMode = () => (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '32px 40px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>AI Agent boshqaruvi</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Bilimlar bazasi, sozlamalar va monitoring.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(34,197,94,0.15)', color: '#22C55E', fontSize: 12, fontWeight: 600 }}>● Agent faol</span>
                        <button className="btn btn-secondary" onClick={() => { setAgentActivated(false); setStep(0); }} style={{ height: 36, padding: '0 16px', fontSize: 13 }}>Qayta sozlash</button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                    {[
                        ['topics', 'Bilim bazasi', docs.length + manualKb.length],
                        ['prompt', 'Prompt & Persona', null],
                        ['unanswered', 'Javobsiz savollar', frequentQs.filter(q => q.status !== 'answered').length],
                    ].map(([id, label, count]) => (
                        <button key={id as string} onClick={() => setManageTab(id as string)} style={{ background: 'none', border: 'none', padding: '0 0 16px', fontSize: 14, fontWeight: 600, color: manageTab === id ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: manageTab === id ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {label} {count != null && count > 0 && <span style={{ background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>{count}</span>}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ flex: 1, padding: 40, overflowY: 'auto', background: 'var(--bg-primary)' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    {manageTab === 'topics' && renderManageTopics()}
                    {manageTab === 'prompt' && renderManagePrompt()}
                    {manageTab === 'unanswered' && renderManageUnanswered()}
                </div>
            </div>
        </div>
    );

    const renderManageTopics = () => (
        <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} style={{ height: 38, padding: '0 16px', gap: 8, fontSize: 13 }}><Upload size={14} /> Fayl yuklash</button>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.xlsx,.xls" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} style={{ display: 'none' }} />
            </div>
            <div style={{ ...cs, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Hujjat / Mavzu</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Manba</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Holat</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}></th>
                    </tr></thead>
                    <tbody>
                        {docs.map(doc => (<tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '14px 16px', fontWeight: 500, fontSize: 14 }}>{doc.filename}</td><td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>Fayl</td><td style={{ padding: '14px 16px' }}><span className={doc.status === 'completed' ? 'badge success' : 'badge warning'} style={{ fontSize: 11 }}>{doc.status === 'completed' ? 'Tayyor' : 'Yuklanmoqda'}</span></td><td style={{ padding: '14px 16px', textAlign: 'right' }}><button onClick={() => handleDelete(doc.id, doc.filename)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button></td></tr>))}
                        {manualKb.map(item => (<tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '14px 16px', fontWeight: 500, fontSize: 14, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.question || item.answer?.substring(0, 50)}</td><td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>FAQ</td><td style={{ padding: '14px 16px' }}><span className="badge success" style={{ fontSize: 11 }}>Tayyor</span></td><td style={{ padding: '14px 16px', textAlign: 'right' }}><button onClick={() => handleDeleteManual(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button></td></tr>))}
                        {docs.length === 0 && manualKb.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Hali hech narsa qo'shilmagan.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderManagePrompt = () => (
        <div style={cs}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>AI Master Prompt</h2>
            <textarea className="input" style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 13, padding: 16, lineHeight: 1.6, width: '100%' }} value={masterPrompt} onChange={e => setMasterPrompt(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-primary" onClick={handleSavePrompt} disabled={savingPrompt}>{savingPrompt ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Saqlash</button>
            </div>
        </div>
    );

    const renderManageUnanswered = () => (
        <div style={{ ...cs, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)' }}><th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 13 }}>Savol</th><th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 13 }}>Holat</th><th></th></tr></thead>
                <tbody>
                    {frequentQs.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Hali javobsiz savollar yo'q.</td></tr>}
                    {frequentQs.map(q => (
                        <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500 }}>{q.topic}</td>
                            <td style={{ padding: '14px 16px' }}>{q.status === 'answered' ? <span style={{ color: 'var(--success)' }}>Javob berilgan</span> : <span style={{ color: 'var(--warning)' }}>Kutilmoqda</span>}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>{q.status !== 'answered' && <button className="btn btn-secondary" onClick={() => setAnsweringId(q.id)} style={{ fontSize: 13, padding: '6px 14px' }}>Javob berish</button>}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    /* ─── MAIN RENDER ─── */

    if (agentActivated) return renderManageMode();

    const steps = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

    return (
        <div className="page-container animate-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Progress bar */}
            {step > 0 && (
                <div style={{ padding: '20px 40px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, maxWidth: 700, margin: '0 auto' }}>
                        {STEP_LABELS.map((label, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: i < step ? 'var(--accent)' : i === step ? 'var(--accent)' : 'var(--bg-elevated)', color: i <= step ? 'white' : 'var(--text-muted)', border: i <= step ? 'none' : '1px solid var(--border)', transition: 'all 0.3s' }}>
                                    {i < step ? <Check size={14} /> : i + 1}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)', display: i === step ? 'inline' : 'none' }}>{label}</span>
                                {i < STEP_LABELS.length - 1 && <div style={{ width: 32, height: 2, background: i < step ? 'var(--accent)' : 'var(--border)', borderRadius: 2, transition: 'all 0.3s' }} />}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
                {successMsg && <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, marginBottom: 24, color: 'var(--success)', fontSize: 13, maxWidth: 700, margin: '0 auto 24px' }}>{successMsg}</div>}
                {error && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, marginBottom: 24, color: 'var(--danger)', fontSize: 13, maxWidth: 700, margin: '0 auto 24px' }}><AlertTriangle size={14} /> {error} <button onClick={() => setError('')} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'currentcolor', cursor: 'pointer' }}>×</button></div>}
                {steps[step]()}
            </div>

            {/* Navigation */}
            {step > 0 && (
                <div style={{ padding: '16px 40px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary" style={{ padding: '10px 24px', fontSize: 14 }}><ArrowLeft size={16} /> Ortga</button>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{step} / {STEP_LABELS.length}</span>
                    {step < 5 ? (
                        <button onClick={() => setStep(s => s + 1)} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}>Keyingi <ArrowRight size={16} /></button>
                    ) : (
                        <button onClick={handleActivate} disabled={savingAll} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 14, background: 'linear-gradient(135deg, #22C55E, #10B981)' }}>
                            {savingAll ? <Loader2 size={16} className="spin" /> : <Zap size={16} />} Faollashtirish
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
