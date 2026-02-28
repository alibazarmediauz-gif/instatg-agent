'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Settings, Play, Pause, Trash2, GitPullRequestDraft } from 'lucide-react';
import Link from 'next/link';

// Mock API Client -> will replace with actual API when hooked up
const fetchAutomations = async () => {
    // try to fetch
    const res = await fetch('/api/automations?tenant_id=123e4567-e89b-12d3-a456-426614174000'); // using a dummy tenant id if not in context
    if (res.ok) {
        return res.json();
    }
    return { automations: [] };
};

export default function AutomationsPage() {
    const [automations, setAutomations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load automations
        setLoading(false);
    }, []);

    // Theme styles matching other pages
    const themeParams = {
        bg: 'var(--bg-primary)',
        card: 'var(--bg-card)',
        border: 'var(--border)',
        text: 'var(--text-primary)',
        muted: 'var(--text-secondary)',
        accent: 'var(--accent)',
    };

    return (
        <div style={{ padding: 40, background: themeParams.bg, minHeight: '100vh', color: themeParams.text }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <GitPullRequestDraft size={28} color={themeParams.accent} />
                        Avtomatizatsiya (Bot Flow)
                    </h1>
                    <p style={{ color: themeParams.muted, fontSize: 15 }}>
                        Mijozlar bilan yozishmalarni avtomatlashtiring. Visual builder yordamida har xil stsenariylar tuzing.
                    </p>
                </div>
                <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
                    <Plus size={18} /> Yangi Flow Yaratish
                </button>
            </div>

            <div style={{
                background: themeParams.card,
                border: `1px solid ${themeParams.border}`,
                borderRadius: 16,
                padding: 24
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>Yuklanmoqda...</div>
                ) : automations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <GitPullRequestDraft size={32} color={themeParams.accent} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Hali hech qanday flow yo'q</h3>
                        <p style={{ color: themeParams.muted, fontSize: 14, marginBottom: 24 }}>Birinchi avtomatizatsiya zanjirini yarating.</p>
                        <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
                            <Plus size={18} /> Yangi Flow Yaratish
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* List items will go here */}
                    </div>
                )}
            </div>
        </div>
    );
}
