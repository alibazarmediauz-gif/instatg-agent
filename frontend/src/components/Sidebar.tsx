'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    BarChart3,
    Settings,
    Zap,
    Link2,
    Workflow,
    BotMessageSquare,
    Network,
    Megaphone,
    ShieldAlert,
    Users,
    Shield,
    Activity,
    Server
} from 'lucide-react';

import { useLanguage } from '@/lib/LanguageContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();

    const navGroups = [
        {
            label: '⌘ OPERATIONS',
            items: [
                { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { href: '/conversations', label: 'Inbox', icon: BotMessageSquare },
                { href: '/agents', label: 'AI Agents', icon: Users },
                { href: '/contacts', label: 'Leads', icon: Network },
            ],
        },
        {
            label: '⚡️ SALES ENGINE',
            items: [
                { href: '/orchestra', label: 'Automation', icon: Workflow },
                { href: '/knowledge-base', label: 'Training', icon: BookOpen },
                { href: '/analytics', label: 'Analytics', icon: BarChart3 },
                { href: '/admin', label: 'Settings', icon: Settings },
            ],
        },
    ];

    return (
        <aside className="sidebar" style={{
            background: 'rgba(11, 14, 20, 0.4)',
            backdropFilter: 'blur(16px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '10px 0 30px rgba(0, 0, 0, 0.2)'
        }}>
            <div className="sidebar-brand" style={{ marginBottom: 20 }}>
                <div className="sidebar-brand-icon" style={{ background: 'var(--gradient-premium)' }}>
                    <Zap size={18} color="white" />
                </div>
                <div>
                    <h1 style={{ color: 'var(--text-primary)', fontSize: 18 }}>{t('brand.name') || 'SalesAI'}</h1>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em' }}>PRO EDITION</span>
                </div>
            </div>

            <nav className="sidebar-nav" style={{ padding: '0 8px' }}>
                {navGroups.map((group, gi) => (
                    <div key={gi}>
                        {group.label && <div className="nav-group-label" style={{ paddingLeft: 12, fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, marginTop: 16 }}>{group.label}</div>}
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`nav-link ${isActive ? 'active' : ''}`}
                                    style={{
                                        margin: '2px 0',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        border: isActive ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                                        borderRadius: 12,
                                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                                    }}
                                >
                                    <Icon size={18} style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />
                                    <span style={{ fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                                    {isActive && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="sidebar-user" style={{
                margin: '20px 8px 10px',
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div className="sidebar-avatar" style={{ background: 'var(--gradient-premium)', width: 40, height: 40, borderRadius: 12 }}>A</div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Alex Morgan</div>
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Administrator</div>
                </div>
            </div>
        </aside>
    );
}
