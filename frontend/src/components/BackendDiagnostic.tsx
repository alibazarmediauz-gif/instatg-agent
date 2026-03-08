'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, ServerOff, WifiOff } from 'lucide-react';

const API_HEALTH_ENDPOINT = (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'https://instatg-agent-production.up.railway.app'
        : 'http://localhost:8000')
).replace(/\/+$/, '') + '/docs'; // Using /docs as a simple reachability check

export default function BackendDiagnostic() {
    const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [isRetrying, setIsRetrying] = useState(false);

    const checkHealth = async () => {
        setIsRetrying(true);
        try {
            // We use no-cors or a simple fetch to see if the server responds at all
            // In many local setups, /docs or /redoc is always available
            const res = await fetch(API_HEALTH_ENDPOINT, { mode: 'no-cors', cache: 'no-store' });
            setStatus('online');
        } catch (err) {
            setStatus('offline');
        } finally {
            setIsRetrying(false);
        }
    };

    useEffect(() => {
        checkHealth();
        // Check every 30 seconds
        const timer = setInterval(checkHealth, 30000);
        return () => clearInterval(timer);
    }, []);

    if (status === 'online') return null;

    if (status === 'checking' && !isRetrying) return null;

    return (
        <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderLeft: '4px solid var(--danger)',
            padding: '12px 20px',
            margin: '20px 32px 0',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            animation: 'slideIn 0.3s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--danger)'
                }}>
                    <ServerOff size={18} />
                </div>
                <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                        Backend System Offline
                    </h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                        The local API is unreachable. Buttons and data saves will not work until you start the backend server.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 11, background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 4, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {API_HEALTH_ENDPOINT.replace('/docs', '')}
                </div>
                <button
                    onClick={checkHealth}
                    disabled={isRetrying}
                    className="btn btn-sm btn-secondary"
                    style={{ gap: 6, fontSize: 12, height: 32 }}
                >
                    <RefreshCw size={14} className={isRetrying ? 'spin' : ''} />
                    {isRetrying ? 'Checking...' : 'Retry Connection'}
                </button>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
