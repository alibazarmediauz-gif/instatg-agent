export default function CRMSyncRedirect() {
    // This page is now deprecated. The user wants a simplified CRM page.
    // The main functionality is now all in `/crm`. We redirect them from here.
    if (typeof window !== 'undefined') {
        window.location.href = '/crm';
    }
    return null;
}
