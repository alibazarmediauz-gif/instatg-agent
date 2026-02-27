'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, Filter, X, MoreHorizontal,
    Phone, Mail, MessageSquare, User,
    Star, ArrowUpRight, Loader2, Tag,
    Calendar, Check, Edit2, Trash2, AtSign
} from 'lucide-react';
import { useTenant } from '@/lib/TenantContext';
import { getLeads } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

// ─── Contacts ─────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
    telegram: { label: 'Telegram', bg: 'rgba(41,182,246,0.12)', color: '#29b6f6' },
    instagram: { label: 'Instagram', bg: 'rgba(233,30,99,0.12)', color: '#e91e63' },
    voice: { label: 'Voice', bg: 'rgba(102,187,106,0.12)', color: '#66bb6a' },
    chat: { label: 'Chat', bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
};

const TAG_COLORS: Record<string, string> = {
    'VIP': '#f59e0b',
    'Hot Lead': '#ef4444',
    'Warm': '#f97316',
    'Cold': '#6b7280',
    'Enterprise': '#8b5cf6',
    'EU': '#3b82f6',
    'New': '#10b981',
};

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 80 ? '#10b981' : score >= 50 ? '#f97316' : '#ef4444';
    return (
        <div style={{
            width: 40, height: 40, borderRadius: '50%', border: `2.5px solid ${color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color, background: `${color}10`
        }}>
            {score}
        </div>
    );
}

export default function ContactsPage() {
    const { tenantId } = useTenant();
    const { t } = useLanguage();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [channelFilter, setChannelFilter] = useState<string>('all');
    const [tagFilter, setTagFilter] = useState<string>('all');
    const [selectedContact, setSelectedContact] = useState<any | null>(null);
    const [isNewOpen, setIsNewOpen] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', channel: 'telegram', tags: '' });
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Load real contacts from API
    useEffect(() => {
        const load = async () => {
            try {
                const data = await getLeads(tenantId) as any;
                if (data.data) {
                    const mapped = data.data.map((l: any) => ({
                        id: l.id,
                        name: l.contact_info?.name || l.contact_name || 'Unknown',
                        phone: l.contact_info?.phone || '—',
                        email: l.contact_info?.email || '—',
                        channel: l.channel || 'chat',
                        tags: l.tags || [],
                        status: l.is_active ? 'active' : 'inactive',
                        clv: l.clv || 0,
                        score: l.probability_score || 0,
                        last_seen: '—',
                        avatar: (l.contact_info?.name || l.contact_name || 'U').substring(0, 2).toUpperCase(),
                    }));
                    setContacts(mapped);
                }
            } catch (err) { console.error("Failed to load contacts", err); }
        };
        load();
    }, [tenantId]);

    const allTags = useMemo(() => Array.from(new Set(contacts.flatMap(c => c.tags || []))), [contacts]);

    const filtered = useMemo(() =>
        contacts.filter(c => {
            const q = search.toLowerCase();
            const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
            const matchChannel = channelFilter === 'all' || c.channel === channelFilter;
            const matchTag = tagFilter === 'all' || (c.tags || []).includes(tagFilter);
            return matchSearch && matchChannel && matchTag;
        }), [contacts, search, channelFilter, tagFilter]);

    const handleCreate = () => {
        const tags = newContact.tags.split(',').map(t => t.trim()).filter(Boolean);
        const contact = {
            ...newContact,
            id: Date.now().toString(),
            tags,
            status: 'active',
            clv: 0,
            score: 50,
            last_seen: 'Just now',
            avatar: newContact.name.substring(0, 2).toUpperCase() || '??',
        };
        setContacts(prev => [contact, ...prev]);
        setIsNewOpen(false);
        setNewContact({ name: '', phone: '', email: '', channel: 'telegram', tags: '' });
    };

    if (loading) return (
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <Loader2 className="animate-spin" size={32} color="var(--text-muted)" />
        </div>
    );

    return (
        <div className="page-container animate-in" style={{ padding: '28px 36px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>{t('nav.contacts')}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                        {t('nav.contacts_desc')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" style={{ gap: 8, height: 42, paddingInline: 20 }}>
                        <AtSign size={16} /> {t('nav.btn_send_campaign')}
                    </button>
                    <button onClick={() => setIsNewOpen(true)} className="btn btn-primary" style={{ gap: 8, height: 42, paddingInline: 20 }}>
                        <Plus size={16} /> {t('nav.btn_add_contact')}
                    </button>
                </div>
            </div>

            {/* ── Filters ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <Search size={15} color="var(--text-muted)" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        type="text" placeholder="Search..."
                        style={{ border: 'none', background: 'transparent', padding: '11px 10px', width: '100%', color: 'var(--text-primary)', outline: 'none', fontSize: 14 }}
                    />
                    {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={14} /></button>}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                    {['all', 'telegram', 'instagram', 'voice', 'chat'].map(ch => (
                        <button key={ch} onClick={() => setChannelFilter(ch)} style={{
                            padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', border: '1px solid var(--border)', textTransform: 'capitalize',
                            background: channelFilter === ch ? 'var(--accent)' : 'var(--bg-card)',
                            color: channelFilter === ch ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s'
                        }}>{ch}</button>
                    ))}
                </div>

                <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {(['grid', 'list'] as const).map(mode => (
                        <button key={mode} onClick={() => setViewMode(mode)} style={{
                            padding: '8px 16px', background: viewMode === mode ? 'var(--accent)' : 'var(--bg-card)',
                            color: viewMode === mode ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600
                        }}>{mode === 'grid' ? t('nav.grid') || 'Grid' : t('nav.list') || 'List'}</button>
                    ))}
                </div>
            </div>

            {/* ── Grid / List ─────────────────────────────────────── */}
            {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, flex: 1 }}>
                    {filtered.map(c => <ContactCard key={c.id} contact={c} onClick={() => setSelectedContact(c)} />)}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 1fr 1fr 1.2fr 1fr 1fr 1fr 120px', padding: '10px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        <span>Mijoz</span>
                        <span>{t('nav.col_source')}</span>
                        <span>{t('nav.col_manager')}</span>
                        <span>{t('nav.col_stage')}</span>
                        <span>Plan</span>
                        <span style={{ textAlign: 'center' }}>AI Score</span>
                        <span>{t('nav.col_interaction')}</span>
                        <span />
                    </div>
                    {filtered.map(c => <ContactRow key={c.id} contact={c} onClick={() => setSelectedContact(c)} />)}
                </div>
            )}

            {/* ── Modals ────────────────────────────────────────── */}
            {isNewOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="animate-in" style={{ width: 500, background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{t('nav.btn_add_contact')}</h2>
                            <button onClick={() => setIsNewOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={22} /></button>
                        </div>
                        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Form fields... */}
                        </div>
                        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsNewOpen(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleCreate} disabled={!newContact.name} className="btn btn-primary">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedContact && <ContactDetail contact={selectedContact} onClose={() => setSelectedContact(null)} />}
        </div>
    );
}

// ── Card Component ─────────────────────────────────────────────────────────────
function ContactCard({ contact: c, onClick }: { contact: any; onClick: () => void }) {
    const ch = CHANNEL_CONFIG[c.channel] || CHANNEL_CONFIG.chat;
    return (
        <div
            className="card"
            onClick={onClick}
            style={{
                padding: 24, cursor: 'pointer', borderRadius: 16, border: '1px solid var(--border)',
                background: 'var(--bg-card)', transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                position: 'relative', overflow: 'hidden'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
            {/* Top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.status === 'active' ? 'var(--accent)' : 'var(--border)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: `linear-gradient(135deg, var(--accent), #8b5cf6)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0
                    }}>{c.avatar}</div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3 }}>{c.name}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: ch.bg, color: ch.color, textTransform: 'capitalize' }}>{ch.label}</span>
                    </div>
                </div>
                <ScoreBadge score={c.score} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Phone size={12} /> {c.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Mail size={12} /> {c.email}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                {(c.tags || []).map((tag: string) => (
                    <span key={tag} style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10,
                        background: `${TAG_COLORS[tag] || '#6b7280'}18`, color: TAG_COLORS[tag] || 'var(--text-muted)'
                    }}>{tag}</span>
                ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last: {c.last_seen}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>${c.clv.toLocaleString()}</div>
            </div>
        </div>
    );
}

// ── List Row Component ─────────────────────────────────────────────────────────
function ContactRow({ contact: c, onClick }: { contact: any; onClick: () => void }) {
    const { t } = useLanguage();
    const ch = CHANNEL_CONFIG[c.channel] || CHANNEL_CONFIG.chat;
    return (
        <div
            onClick={onClick}
            style={{
                display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 1fr 1fr 1.2fr 1fr 1fr 1fr 120px',
                padding: '12px 20px', background: 'var(--bg-card)', borderRadius: 12,
                border: '1px solid var(--border)', alignItems: 'center', cursor: 'pointer',
                transition: 'all 0.15s', gap: 12
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{c.avatar}</div>
                <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone}</div>
                </div>
            </div>

            {/* Source */}
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {c.source || ch.label}
            </div>

            {/* Manager */}
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={12} /> {c.manager || 'No manager'}
            </div>

            {/* Stage */}
            <div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{c.stage || 'Lead'}</span>
            </div>

            {/* Plan */}
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                {c.plan || '—'}
            </div>

            {/* Score */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ScoreBadge score={c.score} />
            </div>

            {/* Last Interaction */}
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.last_seen}</div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button onClick={e => { e.stopPropagation(); }} title={t('nav.btn_assign_manager')} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <User size={14} />
                </button>
                <button onClick={e => { e.stopPropagation(); }} title={t('nav.btn_send_campaign')} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <AtSign size={14} />
                </button>
                <button onClick={e => { e.stopPropagation(); }} title="Send to Voice Agent" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <Phone size={14} />
                </button>
            </div>
        </div>
    );
}

// ── Detail Slide-Over ──────────────────────────────────────────────────────────
function ContactDetail({ contact: c, onClose }: { contact: any; onClose: () => void }) {
    const ch = CHANNEL_CONFIG[c.channel] || CHANNEL_CONFIG.chat;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
            <div className="animate-in" style={{ width: 520, height: '100%', background: 'var(--bg-main)', borderLeft: '1px solid var(--border)', boxShadow: '-16px 0 48px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '28px 28px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, var(--accent), #8b5cf6)` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{c.avatar}</div>
                            <div>
                                <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>{c.name}</h2>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 10, background: ch.bg, color: ch.color }}>{c.source || ch.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)' }}>{c.plan || 'No Plan'}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 10, background: c.status === 'active' ? 'rgba(34,197,94,0.1)' : 'var(--bg-elevated)', color: c.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }}>
                                        {c.status === 'active' ? '● Active' : '○ Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                    {/* KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
                        {[
                            { label: 'Lifetime Value', value: `$${c.clv.toLocaleString()}`, color: 'var(--success)' },
                            { label: 'AI Score', value: `${c.score}%`, color: c.score >= 80 ? 'var(--success)' : c.score >= 50 ? 'var(--warning)' : 'var(--danger)' },
                            { label: 'Last Seen', value: c.last_seen, color: 'var(--text-primary)' },
                        ].map(kpi => (
                            <div key={kpi.label} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{kpi.label}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Contact Info */}
                    <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 14 }}>Tafsilotlar</h3>
                    <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 24 }}>
                        {[
                            { icon: <Phone size={14} />, label: 'Phone', value: c.phone },
                            { icon: <Mail size={14} />, label: 'Email', value: c.email },
                            { icon: <User size={14} />, label: 'Manager', value: c.manager || 'Unassigned' },
                            { icon: <Tag size={14} />, label: 'Lead Stage', value: c.stage || 'New' },
                        ].map((row, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i === 3 ? 'none' : '1px solid var(--border)' }}>
                                <div style={{ color: 'var(--text-muted)', width: 20 }}>{row.icon}</div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{row.label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{row.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tags */}
                    <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 14 }}>Tags</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                        {(c.tags || []).map((tag: string) => (
                            <span key={tag} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 12, background: `${TAG_COLORS[tag] || '#6b7280'}18`, color: TAG_COLORS[tag] || 'var(--text-muted)', border: `1px solid ${TAG_COLORS[tag] || '#6b7280'}30` }}>{tag}</span>
                        ))}
                        {(c.tags || []).length === 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No tags assigned</span>}
                    </div>

                    {/* Activity Timeline */}
                    <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 14 }}>Recent Activity</h3>
                    <div style={{ position: 'relative', paddingLeft: 16 }}>
                        <div style={{ position: 'absolute', left: 20, top: 8, bottom: 8, width: 2, background: 'var(--border)' }} />
                        {[
                            { time: 'Today, 10:30', event: 'Inbound message via ' + (ch.label), dot: ch.color },
                            { time: 'Yesterday', event: 'AI follow-up sent automatically', dot: '#8b5cf6' },
                            { time: '3 days ago', event: 'Contact added to pipeline', dot: 'var(--accent)' },
                        ].map((a, i) => (
                            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.dot, border: '2px solid var(--bg-main)', marginTop: 3, flexShrink: 0 }} />
                                <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: '10px 14px', flex: 1 }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{a.time}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.event}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '20px 28px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 8 }}><Phone size={14} /> Call</button>
                    <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', gap: 8 }}><MessageSquare size={14} /> Message</button>
                    <button className="btn btn-secondary" style={{ gap: 8, paddingInline: 14 }}><Edit2 size={14} /></button>
                </div>
            </div>
        </div>
    );
}
