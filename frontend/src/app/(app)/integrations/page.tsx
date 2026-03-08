import {
    Link2, Database, Zap, Plus, Globe, MessageSquare, Instagram, Phone, Calendar, ArrowUpRight, CheckCircle2, AlertCircle
} from 'lucide-react';

const CHANNELS = [
    { id: 'telegram', name: 'Telegram Bot', status: 'connected', description: 'Handle sales inquiries via Telegram DMs.', icon: <Zap size={24} color="#0088cc" />, account: '@SarahSales_Bot' },
    { id: 'instagram', name: 'Instagram DM', status: 'connected', description: 'Automate beauty & retail sales on Instagram.', icon: <Instagram size={24} color="#E4405F" />, account: 'alibazar_media' },
    { id: 'whatsapp', name: 'WhatsApp Business', status: 'disconnected', description: 'Connect official WhatsApp API for high-volume sales.', icon: <MessageSquare size={24} color="#25D366" /> },
    { id: 'webchat', name: 'Website Widget', status: 'active', description: 'Convert website visitors into leads live.', icon: <Globe size={24} color="var(--accent)" /> }
];

const INFRASTRUCTURE = [
    { id: 'amocrm', name: 'amoCRM', status: 'connected', description: 'Master CRM for lead tracking and pipeline management.', icon: <Database size={24} color="var(--accent)" />, sync: 'Live Sync On' },
    { id: 'telephony', name: 'AI Voice (Telephony)', status: 'disconnected', description: 'Make and receive AI sales calls via Vapi or Twilio.', icon: <Phone size={24} color="#10b981" />, setupRequired: true },
    { id: 'calendar', name: 'Google Calendar', status: 'disconnected', description: 'Allow agents to book appointments on your calendar.', icon: <Calendar size={24} color="#4285F4" /> }
];

export default function IntegrationHub() {
    return (
        <div className="page-container animate-in" style={{ padding: '32px 40px', height: '100vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>Connection Center</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 600 }}>
                        Connect your communication channels and business tools here. Once connected, your AI agents will automatically begin operating across these platforms.
                    </p>
                </div>
                <button className="btn btn-primary" style={{ padding: '12px 24px', gap: 10 }}>
                    <Plus size={18} /> Add New Integration
                </button>
            </div>

            <section style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Link2 size={18} color="var(--accent)" />
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 800 }}>Conversation Channels</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                    {CHANNELS.map(ch => (
                        <IntegrationCard key={ch.id} data={ch} />
                    ))}
                </div>
            </section>

            <section style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Database size={18} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 800 }}>Business Infrastructure</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                    {INFRASTRUCTURE.map(inf => (
                        <IntegrationCard key={inf.id} data={inf} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function IntegrationCard({ data }: { data: any }) {
    const isConnected = data.status === 'connected' || data.status === 'active';

    return (
        <div className="card" style={{ padding: 24, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 20, transition: 'all 0.2s', background: isConnected ? 'rgba(255,255,255,0.02)' : 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    {data.icon}
                </div>
                {isConnected ? (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 20 }}>
                        <CheckCircle2 size={12} /> ACTIVE
                    </span>
                ) : (
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: 20 }}>
                        OFFLINE
                    </span>
                )}
            </div>

            <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{data.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, minHeight: 40 }}>{data.description}</p>
            </div>

            {isConnected && data.account && (
                <div style={{ background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Linked Account:</span>
                    <span>{data.account}</span>
                </div>
            )}

            {isConnected && data.sync && (
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={14} /> {data.sync}
                </div>
            )}

            {!isConnected && data.id === 'telephony' && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: 8, fontSize: 12, color: 'var(--warning)', display: 'flex', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>Setup Vapi or Twilio to enable AI voice calls.</span>
                </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                {isConnected ? (
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
                        Manage Settings <ArrowUpRight size={14} />
                    </button>
                ) : (
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Connect Now
                    </button>
                )}
                );
}

                function PlusIcon({size}: {size: number }) {
    return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                );
}
