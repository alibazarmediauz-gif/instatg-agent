'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, HelpCircle, Check, Globe } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useLanguage } from '@/lib/LanguageContext';
import ThemeToggle from './ThemeToggle';

export default function TopBar() {
    const pathname = usePathname();
    const { t, locale, setLocale } = useLanguage();

    const pageKeys: Record<string, { title: string; subtitle: string }> = {
        '/dashboard': { title: 'nav.control_center', subtitle: 'topbar.dashboard_subtitle' },
        '/crm': { title: 'nav.crm', subtitle: 'topbar.crm_subtitle' },
        '/contacts': { title: 'nav.contacts', subtitle: 'topbar.contacts_subtitle' },
        '/prompts': { title: 'nav.prompts', subtitle: 'topbar.prompts_subtitle' },
        '/voice-agents': { title: 'nav.voice_agents', subtitle: 'topbar.voice_agents_subtitle' },
        '/chat-agents': { title: 'nav.chat_agents', subtitle: 'topbar.chat_agents_subtitle' },
        '/campaigns': { title: 'nav.campaigns', subtitle: 'topbar.campaigns_subtitle' },
        '/knowledge-base': { title: 'nav.knowledge', subtitle: 'topbar.knowledge_subtitle' },
        '/analytics': { title: 'nav.analytics', subtitle: 'topbar.analytics_subtitle' },
        '/billing': { title: 'nav.billing', subtitle: 'topbar.billing_subtitle' },
        '/qa': { title: 'nav.qa', subtitle: 'topbar.qa_subtitle' },
        '/integrations': { title: 'nav.integrations', subtitle: 'topbar.integrations_subtitle' },
        '/admin': { title: 'nav.admin', subtitle: 'topbar.admin_subtitle' },
    };

    const page = pageKeys[pathname || '/dashboard'] || pageKeys['/dashboard'];

    // DEMO TENANT ID (Assuming single tenant for demo)
    const DEMO_TENANT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(DEMO_TENANT_ID);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const toggleLanguage = () => {
        const next: Record<string, string> = { 'uz': 'ru', 'ru': 'en', 'en': 'uz' };
        setLocale(next[locale] as any);
    };

    return (
        <div className="top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div className="top-bar-left">
                <h2 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{t(page.title)}</h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{t(page.subtitle)}</p>
            </div>
            <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

                {/* Language Switcher */}
                <button
                    onClick={toggleLanguage}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 20,
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                        fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                        textTransform: 'uppercase'
                    }}
                >
                    <Globe size={14} />
                    {locale}
                </button>

                <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', borderRadius: 20 }}>
                    <span className="status-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                    5 TG, 2 IG, 1 FB {t('topbar.connected_channels')}
                </div>

                <ThemeToggle />

                {/* Notification Bell */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                        className="icon-btn"
                        onClick={() => setIsOpen(!isOpen)}
                        style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: -2, right: -2,
                                background: '#ef4444', color: 'white',
                                fontSize: 10, fontWeight: 'bold',
                                width: 16, height: 16, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid var(--bg-card)'
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isOpen && (
                        <div style={{
                            position: 'absolute', top: 44, right: 0, width: 340,
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            zIndex: 100, display: 'flex', flexDirection: 'column',
                            maxHeight: 480, overflow: 'hidden'
                        }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{t('topbar.notifications')} {unreadCount > 0 && <span style={{ color: 'var(--accent)', fontWeight: 'bold', marginLeft: 4 }}>({unreadCount})</span>}</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Check size={14} /> {t('topbar.mark_all_read')}
                                    </button>
                                )}
                            </div>

                            <div style={{ overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-body)' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                        <Bell size={24} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                                        {t('topbar.no_notifications')}
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => notif.is_read ? null : markAsRead(notif.id)}
                                            style={{
                                                padding: '16px', borderBottom: '1px solid var(--border)',
                                                background: notif.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                                cursor: 'pointer', transition: 'background 0.2s',
                                                display: 'flex', gap: 12, alignItems: 'flex-start'
                                            }}
                                        >
                                            <div style={{
                                                width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                                                background: notif.is_read ? 'transparent' : 'var(--accent)'
                                            }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: notif.is_read ? 500 : 700, color: 'var(--text-primary)' }}>{notif.title}</h4>
                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, opacity: 0.9 }}>
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button className="icon-btn" style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' }}>
                    <HelpCircle size={18} />
                </button>
            </div>
        </div>
    );
}
