'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    MessageSquare,
    Mic,
    BookOpen,
    BarChart3,
    Settings,
    Zap,
    Link2,
    Workflow,
    Headset,
    BotMessageSquare,
    Network,
    Megaphone,
    CreditCard,
    ShieldAlert,
    Users,
    Shield
} from 'lucide-react';

import { useLanguage } from '@/lib/LanguageContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();

    const navGroups = [
        {
            label: null,
            items: [
                { href: '/dashboard', label: t('nav.control_center'), icon: LayoutDashboard },
                { href: '/crm', label: t('nav.crm'), icon: Network },
                { href: '/contacts', label: t('nav.contacts'), icon: Users },
                { href: '/prompts', label: t('nav.prompts'), icon: BookOpen },
                { href: '/voice-agents', label: t('nav.voice_agents'), icon: Headset },
                { href: '/chat-agents', label: t('nav.chat_agents'), icon: BotMessageSquare },
                { href: '/campaigns', label: t('nav.campaigns'), icon: Megaphone },
                { href: '/knowledge-base', label: t('nav.knowledge'), icon: BookOpen },
                { href: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
                { href: '/billing', label: t('nav.billing'), icon: CreditCard },
                { href: '/qa', label: t('nav.qa'), icon: ShieldAlert },
                { href: '/integrations', label: t('nav.integrations'), icon: Link2 },
                { href: '/admin', label: t('nav.admin'), icon: Shield },
            ],
        },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon">
                    <Zap size={18} color="white" />
                </div>
                <div>
                    <h1>{t('brand.name') || 'SalesAI'}</h1>
                    <span>{t('brand.subtitle') || 'AI Sales Department'}</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navGroups.map((group, gi) => (
                    <div key={gi}>
                        {group.label && <div className="nav-group-label">{group.label}</div>}
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                            return (
                                <Link key={item.href} href={item.href} className={`nav-link ${isActive ? 'active' : ''}`}>
                                    <Icon />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="sidebar-user">
                <div className="sidebar-avatar">A</div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Alex Morgan</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin</div>
                </div>
            </div>
        </aside>
    );
}
