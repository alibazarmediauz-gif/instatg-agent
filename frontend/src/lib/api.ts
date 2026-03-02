/**
 * InstaTG Agent — API Client
 * Centralized HTTP client for all backend API calls.
 */

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'https://instatg-agent-production.up.railway.app'
        : 'http://localhost:8000')
).replace(/\/+$/, '');

interface FetchOptions extends RequestInit {
    params?: Record<string, string>;
}

function normalizeEndpoint(endpoint: string): string {
    const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Preserve non-API health endpoint, enforce /api for all other calls.
    if (normalized === '/health' || normalized.startsWith('/api/')) {
        return normalized;
    }

    return `/api${normalized}`;
}

async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const normalizedEndpoint = normalizeEndpoint(endpoint);

    let url = `${API_BASE_URL}${normalizedEndpoint}`;
    if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(url, {
        ...fetchOptions,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...fetchOptions.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `API Error: ${response.status}`);
    }

    return response.json();
}

// ─── Dashboard ──────────────────────────────────────────────────────

export async function getDashboardStats(tenantId: string, days: number = 1) {
    return apiClient('/api/dashboard/stats', {
        params: { tenant_id: tenantId, days: String(days) },
    });
}

export async function getConversionGraph(tenantId: string, days: number = 7) {
    return apiClient('/api/dashboard/conversion-graph', {
        params: { tenant_id: tenantId, days: String(days) },
    });
}

export async function getChannelBreakdown(tenantId: string, days: number = 7) {
    return apiClient('/api/dashboard/channel-breakdown', {
        params: { tenant_id: tenantId, days: String(days) },
    });
}

// ─── Conversations ──────────────────────────────────────────────────

export async function getConversations(
    tenantId: string,
    filters: { channel?: string; outcome?: string; search?: string; days?: number; page?: number } = {}
) {
    const params: Record<string, string> = { tenant_id: tenantId };
    if (filters.channel) params.channel = filters.channel;
    if (filters.outcome) params.outcome = filters.outcome;
    if (filters.search) params.search = filters.search;
    if (filters.days) params.days = String(filters.days);
    if (filters.page) params.page = String(filters.page);
    return apiClient('/api/conversations', { params });
}

export async function getConversation(conversationId: string, tenantId: string) {
    return apiClient(`/api/conversations/${conversationId}`, {
        params: { tenant_id: tenantId },
    });
}

// ─── Voice Analysis ─────────────────────────────────────────────────

export async function getVoiceAnalyses(tenantId: string, page: number = 1) {
    return apiClient('/api/voice-analysis', {
        params: { tenant_id: tenantId, page: String(page) },
    });
}

export async function getVoiceAnalysis(analysisId: string, tenantId: string) {
    return apiClient(`/api/voice-analysis/${analysisId}`, {
        params: { tenant_id: tenantId },
    });
}

// ─── Knowledge Base ─────────────────────────────────────────────────

export async function getKnowledgeDocs(tenantId: string) {
    return apiClient('/api/knowledge-base', {
        params: { tenant_id: tenantId },
    });
}

export async function uploadKnowledgeDoc(tenantId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const uploadUrl = `${API_BASE_URL}/api/knowledge-base/upload?tenant_id=${tenantId}`;
    const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail);
    }
    return response.json();
}

export async function deleteKnowledgeDoc(docId: string, tenantId: string) {
    return apiClient(`/api/knowledge-base/${docId}`, {
        method: 'DELETE',
        params: { tenant_id: tenantId },
    });
}

export async function getManualKnowledge(tenantId: string) {
    return apiClient('/api/knowledge-base/manual', {
        params: { tenant_id: tenantId },
    });
}

export async function createManualKnowledge(tenantId: string, question: string, answer: string, mediaUrl: string = "") {
    return apiClient('/api/knowledge-base/manual', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify({ question, answer, media_url: mediaUrl || undefined }),
    });
}

export async function deleteManualKnowledge(itemId: string, tenantId: string) {
    return apiClient(`/api/knowledge-base/manual/${itemId}`, {
        method: 'DELETE',
        params: { tenant_id: tenantId },
    });
}

export async function getFrequentQuestions(tenantId: string) {
    return apiClient('/api/knowledge-base/frequent', {
        params: { tenant_id: tenantId },
    });
}

export async function answerFrequentQuestion(itemId: string, answer: string, tenantId: string) {
    return apiClient(`/api/knowledge-base/frequent/${itemId}/answer`, {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify({ answer }),
    });
}

// ─── Reports ────────────────────────────────────────────────────────

export async function getReports(tenantId: string, days: number = 30) {
    return apiClient('/api/reports', {
        params: { tenant_id: tenantId, days: String(days) },
    });
}

export async function getReport(reportId: string, tenantId: string) {
    return apiClient(`/api/reports/${reportId}`, {
        params: { tenant_id: tenantId },
    });
}

export async function generateReport(tenantId: string) {
    return apiClient('/api/reports/generate', {
        method: 'POST',
        params: { tenant_id: tenantId },
    });
}

// ─── Settings ───────────────────────────────────────────────────────

export async function getTenantSettings(tenantId: string) {
    return apiClient('/api/settings/tenant', {
        params: { tenant_id: tenantId },
    });
}

export async function updateTenantSettings(tenantId: string, data: Record<string, unknown>) {
    return apiClient('/api/settings/tenant', {
        method: 'PATCH',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function getTelegramAccount(tenantId: string) {
    return apiClient('/api/settings/telegram', {
        params: { tenant_id: tenantId },
    });
}

export async function sendTelegramOTP(tenantId: string, phoneNumber: string) {
    return apiClient('/api/settings/telegram/send-otp', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify({ phone_number: phoneNumber }),
    });
}

export async function verifyTelegramOTP(
    tenantId: string,
    phoneNumber: string,
    code: string,
    phoneCodeHash: string,
    password?: string,
) {
    return apiClient('/api/settings/telegram/verify-otp', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify({
            phone_number: phoneNumber,
            code,
            phone_code_hash: phoneCodeHash,
            ...(password ? { password } : {}),
        }),
    });
}

export async function disconnectTelegram(tenantId: string) {
    return apiClient('/api/settings/telegram/disconnect', {
        method: 'POST',
        params: { tenant_id: tenantId },
    });
}

export async function getInstagramAccounts(tenantId: string) {
    return apiClient('/api/settings/instagram-accounts', {
        params: { tenant_id: tenantId },
    });
}

export async function addInstagramAccount(tenantId: string, data: any) {
    return apiClient('/api/settings/instagram-accounts', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function deleteInstagramAccount(tenantId: string, accountId: string) {
    return apiClient(`/api/settings/instagram-accounts/${accountId}`, {
        method: 'DELETE',
        params: { tenant_id: tenantId },
    });
}

// ─── Auth ───────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
    return apiClient('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function signUp(email: string, password: string, businessName: string) {
    return apiClient('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, business_name: businessName }),
    });
}

// ─── Integrations ───────────────────────────────────────────────

export async function getCRMStatus(tenantId: string) {
    return apiClient('/api/integrations/crm-status', {
        params: { tenant_id: tenantId },
    });
}

export async function getAmoAuthUrl(tenantId: string) {
    return apiClient('/api/integrations/amocrm/auth-url', {
        params: { tenant_id: tenantId },
    });
}

export async function disconnectAmoCRM(tenantId: string) {
    return apiClient('/api/integrations/amocrm/disconnect', {
        method: 'POST',
        params: { tenant_id: tenantId },
    });
}

export async function getCRMLeads(tenantId: string, stage?: string) {
    const params: Record<string, string> = { tenant_id: tenantId };
    if (stage) params.stage = stage;
    return apiClient('/api/integrations/crm-leads', { params });
}

// ─── Health ─────────────────────────────────────────────────────

export async function getHealth() {
    return apiClient('/health');
}

// ─── Billing ─────────────────────────────────────────────────────

export async function getBillingWallet(tenantId: string) {
    return apiClient('/api/billing/wallet', {
        params: { tenant_id: tenantId },
    });
}

export async function getBillingUsageLogs(tenantId: string, page: number = 1) {
    return apiClient('/api/billing/usage-logs', {
        params: { tenant_id: tenantId, page: String(page) },
    });
}

export async function topUpWallet(tenantId: string, amount: number) {
    return apiClient('/api/billing/top-up', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify({ amount }),
    });
}

// ─── Leads / CRM ─────────────────────────────────────────────────

export async function getLeads(tenantId: string, stage?: string) {
    const params: Record<string, string> = { tenant_id: tenantId };
    if (stage) params.stage = stage;
    return apiClient('/api/leads', { params });
}

export async function createLead(tenantId: string, data: Record<string, unknown>) {
    return apiClient('/api/leads', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function updateLeadStage(tenantId: string, leadId: string, pipelineStageId: string) {
    return apiClient(`/api/leads/${leadId}/stage`, {
        method: 'PATCH',
        params: { tenant_id: tenantId },
        body: JSON.stringify({ pipeline_stage_id: pipelineStageId }),
    });
}

export async function deleteLead(tenantId: string, leadId: string) {
    return apiClient(`/api/leads/${leadId}`, {
        method: 'DELETE',
        params: { tenant_id: tenantId },
    });
}

export async function getPipelines(tenantId: string) {
    return apiClient('/api/leads/pipelines', {
        params: { tenant_id: tenantId },
    });
}

export async function createPipeline(tenantId: string, data: Record<string, unknown>) {
    return apiClient('/api/leads/pipelines', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

// ─── Campaigns ───────────────────────────────────────────────────

export async function getCampaigns(tenantId: string) {
    return apiClient('/api/campaigns', {
        params: { tenant_id: tenantId },
    });
}

export async function createCampaign(tenantId: string, data: Record<string, unknown>) {
    return apiClient('/api/campaigns', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function startCampaign(tenantId: string, id: string) {
    return apiClient(`/api/campaigns/${id}/start`, {
        method: 'POST',
        params: { tenant_id: tenantId },
    });
}

export async function pauseCampaign(tenantId: string, id: string) {
    return apiClient(`/api/campaigns/${id}/pause`, {
        method: 'POST',
        params: { tenant_id: tenantId },
    });
}

export async function getCampaignStats(tenantId: string, id: string) {
    return apiClient(`/api/campaigns/${id}/stats`, {
        params: { tenant_id: tenantId },
    });
}

// ─── Analytics ───────────────────────────────────────────────────

export async function getAnalyticsDashboard(tenantId: string, days: number = 7) {
    return apiClient('/api/dashboard/stats', {
        params: { tenant_id: tenantId, days: String(days) },
    });
}

// ─── QA ──────────────────────────────────────────────────────────

export async function getQAFlagged(tenantId: string, page: number = 1) {
    return apiClient('/api/qa/flagged', {
        params: { tenant_id: tenantId, page: String(page) },
    });
}

export async function submitQAReview(flagId: string, tenantId: string, data: Record<string, unknown>) {
    return apiClient(`/api/qa/${flagId}/review`, {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

// ─── Chat Agents ─────────────────────────────────────────────────

export async function getChatAgents(tenantId: string) {
    return apiClient('/api/agents/chat', {
        params: { tenant_id: tenantId },
    });
}

export async function createChatAgent(tenantId: string, data: Record<string, unknown>) {
    return apiClient('/api/agents/chat', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function updateChatAgent(tenantId: string, id: string, data: Record<string, unknown>) {
    return apiClient(`/api/agents/chat/${id}`, {
        method: 'PATCH',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function deleteChatAgent(tenantId: string, id: string) {
    return apiClient(`/api/agents/chat/${id}`, {
        method: 'DELETE',
        params: { tenant_id: tenantId },
    });
}

// ─── Voice Agents ─────────────────────────────────────────────────

export async function getVoiceAgents(tenantId: string) {
    return apiClient('/api/agents/voice', {
        params: { tenant_id: tenantId },
    });
}

export async function createVoiceAgent(tenantId: string, data: Record<string, unknown>) {
    return apiClient('/api/agents/voice', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function updateVoiceAgent(tenantId: string, id: string, data: Record<string, unknown>) {
    return apiClient(`/api/agents/voice/${id}`, {
        method: 'PATCH',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function deleteVoiceAgent(tenantId: string, id: string) {
    return apiClient(`/api/agents/voice/${id}`, {
        method: 'DELETE',
        params: { tenant_id: tenantId },
    });
}

// ─── Contacts ─────────────────────────────────────────────────────

export async function getContacts(
    tenantId: string,
    filters: { search?: string; channel?: string; page?: number } = {}
) {
    const params: Record<string, string> = { tenant_id: tenantId };
    if (filters.search) params.search = filters.search;
    if (filters.channel) params.channel = filters.channel;
    if (filters.page) params.page = String(filters.page);
    return apiClient('/api/contacts', { params });
}

export async function createContact(tenantId: string, data: Record<string, unknown>) {
    return apiClient('/api/contacts', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function updateContact(tenantId: string, id: string, data: Record<string, unknown>) {
    return apiClient(`/api/contacts/${id}`, {
        method: 'PATCH',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function deleteContact(tenantId: string, id: string) {
    return apiClient(`/api/contacts/${id}`, {
        method: 'DELETE',
        params: { tenant_id: tenantId },
    });
}

// ─── Prompts ─────────────────────────────────────────────────────

export async function getPrompts(tenantId: string) {
    return apiClient('/api/prompts', {
        params: { tenant_id: tenantId },
    });
}

export async function createPrompt(tenantId: string, data: Record<string, unknown>) {
    return apiClient('/api/prompts', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function updatePrompt(tenantId: string, id: string, data: Record<string, unknown>) {
    return apiClient(`/api/prompts/${id}`, {
        method: 'PATCH',
        params: { tenant_id: tenantId },
        body: JSON.stringify(data),
    });
}

export async function deletePrompt(tenantId: string, id: string) {
    return apiClient(`/api/prompts/${id}`, {
        method: 'DELETE',
        params: { tenant_id: tenantId },
    });
}

export async function setActivePrompt(tenantId: string, id: string) {
    return apiClient(`/api/prompts/${id}/activate`, {
        method: 'POST',
        params: { tenant_id: tenantId },
    });
}

// ─── Meta Integration ───────────────────────────────────────────────

export async function getMetaIntegrationStatus(tenantId: string) {
    return apiClient('/api/integrations/meta/status', {
        params: { tenant_id: tenantId },
    });
}

export async function getMetaConnectUrl(tenantId: string, provider: string = 'all') {
    return apiClient<{ url: string }>('/api/integrations/meta/connect-url', {
        params: { tenant_id: tenantId, provider },
    });
}

export async function disconnectMetaIntegration(tenantId: string, provider: string = 'all') {
    return apiClient('/api/integrations/meta/disconnect', {
        method: 'POST',
        params: { tenant_id: tenantId, provider },
    });
}

export async function getMetaIntegrationAssets(tenantId: string) {
    return apiClient('/api/integrations/meta/assets', {
        params: { tenant_id: tenantId },
    });
}

export async function checkMetaHealth(tenantId: string) {
    return apiClient('/api/integrations/meta/health', {
        params: { tenant_id: tenantId },
    });
}

// ─── Telegram Integration ──────────────────────────────────────────

export async function connectTelegramBot(tenantId: string, token: string) {
    return apiClient('/api/integrations/telegram/connect', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify({ token }),
    });
}

export async function requestTelegramOtp(tenantId: string, phone: string) {
    return apiClient<{ status: string; phone_code_hash: string }>('/api/integrations/telegram/otp/request', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify({ phone }),
    });
}

export async function verifyTelegramOtp(
    tenantId: string,
    phone: string,
    code: string,
    phoneCodeHash: string,
    password?: string
) {
    return apiClient<{ status: string; detail?: string }>('/api/integrations/telegram/otp/verify', {
        method: 'POST',
        params: { tenant_id: tenantId },
        body: JSON.stringify({ phone, code, phone_code_hash: phoneCodeHash, password }),
    });
}
