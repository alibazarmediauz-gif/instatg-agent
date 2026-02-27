'use client';

import { useState } from 'react';
import {
    RefreshCw, CheckCircle, XCircle, Clock,
    ArrowUpRight, Users, Link2, AlertTriangle,
    Play, Pause, Settings,
} from 'lucide-react';

const syncHistory = [
    { time: '01:19 AM', type: 'Full Sync', status: 'success', leads: 24, contacts: 18, duration: '2.3s' },
    { time: '12:00 AM', type: 'Full Sync', status: 'success', leads: 31, contacts: 22, duration: '3.1s' },
    { time: '11:00 PM', type: 'Incremental', status: 'success', leads: 5, contacts: 3, duration: '0.8s' },
    { time: '10:00 PM', type: 'Incremental', status: 'failed', leads: 0, contacts: 0, duration: '—', error: 'Rate limit exceeded' },
    { time: '09:00 PM', type: 'Full Sync', status: 'success', leads: 28, contacts: 19, duration: '2.7s' },
];

const pipeline = [
    { stage: 'New Leads', count: 42, color: 'var(--accent)' },
    { stage: 'In Progress', count: 28, color: 'var(--warning)' },
    { stage: 'Qualified', count: 18, color: 'var(--purple)' },
    { stage: 'Won', count: 12, color: 'var(--success)' },
    { stage: 'Lost', count: 8, color: 'var(--danger)' },
];

export default function CRMSyncPage() {
    const [syncing, setSyncing] = useState(false);
    const [autoSync, setAutoSync] = useState(true);

    const triggerSync = () => {
        setSyncing(true);
        setTimeout(() => setSyncing(false), 3000);
    };

    return (
        <div className="page-container animate-in">
            {/* Connection Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                <div className="stat-card">
                    <div className="stat-icon green"><Link2 size={20} /></div>
                    <div>
                        <div className="stat-label">AmoCRM Status</div>
                        <div className="stat-value" style={{ fontSize: 18, color: 'var(--success)' }}>Connected</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><Users size={20} /></div>
                    <div>
                        <div className="stat-label">Total Synced Leads</div>
                        <div className="stat-value">1,847</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><RefreshCw size={20} /></div>
                    <div>
                        <div className="stat-label">Last Sync</div>
                        <div className="stat-value" style={{ fontSize: 18 }}>2 min ago</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow"><AlertTriangle size={20} /></div>
                    <div>
                        <div className="stat-label">Sync Errors (24h)</div>
                        <div className="stat-value" style={{ color: 'var(--warning)' }}>3</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Sync Controls */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Sync Controls</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-primary btn-sm" onClick={triggerSync} disabled={syncing}>
                                    <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} style={syncing ? { animation: 'spin 1s linear infinite' } : {}} />
                                    {syncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                                <button className="btn btn-secondary btn-sm">
                                    <Settings size={14} /> Configure
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>Auto-Sync</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Automatically sync every 30 minutes</div>
                            </div>
                            <button
                                onClick={() => setAutoSync(!autoSync)}
                                style={{
                                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                                    background: autoSync ? 'var(--success)' : 'var(--bg-card)',
                                    position: 'relative', transition: 'background 0.2s',
                                }}
                            >
                                <div style={{
                                    width: 18, height: 18, borderRadius: '50%', background: 'white',
                                    position: 'absolute', top: 3, left: autoSync ? 23 : 3, transition: 'left 0.2s',
                                }} />
                            </button>
                        </div>
                    </div>

                    {/* Sync History */}
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: '16px 20px' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Sync History</h3>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>TIME</th>
                                    <th>TYPE</th>
                                    <th>STATUS</th>
                                    <th>LEADS</th>
                                    <th>CONTACTS</th>
                                    <th>DURATION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {syncHistory.map((s, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.time}</td>
                                        <td><span className="badge neutral">{s.type}</span></td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {s.status === 'success' ? <CheckCircle size={14} color="var(--success)" /> : <XCircle size={14} color="var(--danger)" />}
                                                <span style={{ color: s.status === 'success' ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: 12 }}>
                                                    {s.status === 'success' ? 'Success' : 'Failed'}
                                                </span>
                                            </span>
                                        </td>
                                        <td>{s.leads}</td>
                                        <td>{s.contacts}</td>
                                        <td>{s.duration}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Lead Pipeline */}
                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Lead Pipeline</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {pipeline.map((p, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{p.stage}</span>
                                    <span style={{ fontSize: 14, fontWeight: 800 }}>{p.count}</span>
                                </div>
                                <div className="progress-bar" style={{ height: 10 }}>
                                    <div className="progress-fill" style={{ width: `${(p.count / 42) * 100}%`, background: p.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 800 }}>108</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Active</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>28.6%</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Win Rate</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 800 }}>4.2d</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg Cycle</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
