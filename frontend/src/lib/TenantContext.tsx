'use client';

import { createContext, useContext, ReactNode } from 'react';

/**
 * Hard-coded Demo Tenant ID.
 * In production, this would come from auth/session.
 */
const DEMO_TENANT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

interface TenantContextType {
    tenantId: string;
}

const TenantContext = createContext<TenantContextType>({ tenantId: DEMO_TENANT_ID });

export function TenantProvider({ children }: { children: ReactNode }) {
    return (
        <TenantContext.Provider value={{ tenantId: DEMO_TENANT_ID }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    return useContext(TenantContext);
}
