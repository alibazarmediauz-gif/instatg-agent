'use client';

import React from 'react';
import { FlowBuilder } from '@/components/automations/FlowBuilder';

export default function AutomationsPage() {
    return (
        <div style={{ height: '100vh', width: '100%', background: 'var(--bg-primary)' }}>
            <FlowBuilder />
        </div>
    );
}

