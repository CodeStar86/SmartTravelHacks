import { logger } from './logger';
import { API_BASE, SUPABASE_ANON_KEY } from './env';
import { getAccessToken } from './supabase';

export function getAffiliateRedirectUrl(slug: string, referrer?: string | null) {
  const url = new URL(`${API_BASE}/affiliates/redirect/${encodeURIComponent(slug)}`);
  if (referrer) {
    url.searchParams.set('referrer', referrer);
  }
  return url.toString();
}

const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['Failed to fetch', 'NetworkError', 'Network request failed'],
};

type AuthMode = 'public' | 'auto' | 'required';

function isRetryableError(error: unknown, status?: number): boolean {
  if (status && RETRY_CONFIG.retryableStatuses.includes(status)) {
    return true;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  return RETRY_CONFIG.retryableErrors.some((message) => errorMessage.includes(message));
}

function getRetryDelay(attemptNumber: number): number {
  return RETRY_CONFIG.retryDelay * Math.pow(2, attemptNumber);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveToken(mode: AuthMode, isReadOnly: boolean) {
  if (mode === 'public' || (mode === 'auto' && isReadOnly)) {
    return SUPABASE_ANON_KEY;
  }

  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in again.');
  }

  return token;
}

async function requestJson<T = any>(
  endpoint: string,
  options: RequestInit = {},
  mode: AuthMode = 'auto',
  retryCount = 0
): Promise<T> {
  const isReadOnly = !options.method || options.method === 'GET';
  const token = await resolveToken(mode, isReadOnly);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  try {
    let response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (!response.ok && response.status === 401 && isReadOnly && mode !== 'required') {
      const { Authorization: _authorization, ...headersWithoutAuth } = headers;
      response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers: headersWithoutAuth });
    }

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('API request failed:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        retryCount,
      });

      if (isRetryableError(errorText, response.status) && retryCount < RETRY_CONFIG.maxRetries) {
        await wait(getRetryDelay(retryCount));
        return requestJson(endpoint, options, mode, retryCount + 1);
      }

      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  } catch (error) {
    if (isRetryableError(error) && retryCount < RETRY_CONFIG.maxRetries) {
      await wait(getRetryDelay(retryCount));
      return requestJson(endpoint, options, mode, retryCount + 1);
    }

    if (error instanceof Error) {
      logger.warn(`API call to ${endpoint} failed after ${retryCount + 1} attempts:`, error.message);
    }
    throw error;
  }
}

export function apiCall<T = any>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
  return requestJson<T>(endpoint, options, 'auto', retryCount);
}

export function apiCallPublic<T = any>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
  return requestJson<T>(endpoint, options, 'public', retryCount);
}

export function apiCallAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return requestJson<T>(endpoint, options, 'required');
}

// Posts API calls
export const postApi = {
  list: (params?: { status?: string; category?: string; tag?: string; limit?: number; offset?: number; search?: string }) =>
    apiCall('/posts', {
      headers: { 'X-Query': JSON.stringify(params || {}) },
    }).then((response) => {
      // Handle both old format (array) and new format (object with posts array)
      if (Array.isArray(response)) {
        return response;
      }
      return response.posts || [];
    }),
  
  count: (params?: { status?: string }) =>
    apiCall('/posts/count', {
      headers: { 'X-Query': JSON.stringify(params || {}) },
    }),
  
  // Public pages should prefer getBySlug. Admin edit pages use getByIdAuth so drafts/private posts can be loaded.
  getById: (id: string) => apiCallPublic(`/posts/${id}`),
  getByIdAuth: (id: string) => apiCallAuth(`/posts/${id}`),
  getBySlug: (slug: string) => apiCallPublic(`/posts/slug/${slug}`),
  create: (data: any) => apiCallAuth('/posts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCallAuth(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiCallAuth(`/posts/${id}`, { method: 'DELETE' }),
  incrementViews: (id: string) =>
    apiCallPublic(`/posts/${id}/view`, { method: 'POST' }),
};

// Category API calls
export const categoryApi = {
  list: () => apiCall('/categories'),
  get: (id: string) => apiCall(`/categories/${id}`),
  getBySlug: (slug: string) => apiCall(`/categories/slug/${slug}`),
  create: (category: any) => apiCallAuth('/categories', { method: 'POST', body: JSON.stringify(category) }),
  update: (id: string, category: any) => apiCallAuth(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(category) }),
  delete: (id: string) => apiCallAuth(`/categories/${id}`, { method: 'DELETE' })
};

// Tag API calls
export const tagApi = {
  list: () => apiCall('/tags'),
  get: (id: string) => apiCall(`/tags/${id}`),
  getBySlug: (slug: string) => apiCall(`/tags/slug/${slug}`),
  create: (tag: any) => apiCallAuth('/tags', { method: 'POST', body: JSON.stringify(tag) }),
  update: (id: string, tag: any) => apiCallAuth(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(tag) }),
  delete: (id: string) => apiCallAuth(`/tags/${id}`, { method: 'DELETE' })
};

// Affiliate API calls
export const affiliateApi = {
  // Public resources page needs to list published affiliate links without an admin session.
  list: () => apiCall('/affiliates'),
  get: (id: string) => apiCall(`/affiliates/${id}`),
  create: (link: any) => apiCallAuth('/affiliates', { method: 'POST', body: JSON.stringify(link) }),
  update: (id: string, link: any) => apiCallAuth(`/affiliates/${id}`, { method: 'PUT', body: JSON.stringify(link) }),
  delete: (id: string) => apiCallAuth(`/affiliates/${id}`, { method: 'DELETE' }),
  trackClick: (slug: string, referrer?: string) => 
    apiCall(`/affiliates/track/${slug}`, { 
      method: 'POST', 
      body: JSON.stringify({ referrer }) 
    }),
};

// Media API calls
export const mediaApi = {
  list: () => apiCallAuth('/media'),
  upload: async (file: File, altText?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('alt_text', altText);
    
    const token = await getAccessToken();
    if (!token) throw new Error('Authentication required for upload.');
    const response = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },
  delete: (id: string) => apiCallAuth(`/media/${id}`, { method: 'DELETE' }),
};

// Settings API calls
export const settingsApi = {
  get: async () => {
    // Settings endpoint is public, use anon key directly
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },
  getAdmin: () => apiCallAuth('/settings/private'),
  update: (settings: any) => apiCallAuth('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
};

// Helper function for backward compatibility
export const fetchSettings = () => settingsApi.get();

// Analytics API calls
export const analyticsApi = {
  getDashboardStats: () => apiCallAuth('/analytics/dashboard'),
  getTopPosts: (limit = 10) => apiCallAuth(`/analytics/top-posts?limit=${limit}`),
};

// AI SEO API calls
export const aiApi = {
  generatePost: (data: { 
    title: string;
    mode?: string;
    rawContent?: string;
    wordCount?: number; 
    tone?: string; 
    keywords?: string[];
    focusKeyword?: string;
    brief?: string;
    targetAudience?: string;
    keyPoints?: string;
  }) =>
    apiCallAuth('/ai/generate-post', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Redirect API calls
export const redirectApi = {
  list: () => apiCallAuth('/redirects'),
  check: (path: string) => {
    // Remove leading slash for the API call since the server route adds it back
    const pathParam = path.startsWith('/') ? path.slice(1) : path;
    // Handle empty path (root) by using a special character or 'index'
    const finalPath = pathParam || 'index';
    return apiCall(`/redirects/check/${finalPath}`);
  },
  create: (redirect: any) => apiCallAuth('/redirects', { method: 'POST', body: JSON.stringify(redirect) }),
  update: (id: string, redirect: any) => apiCallAuth(`/redirects/${id}`, { method: 'PUT', body: JSON.stringify(redirect) }),
  delete: (id: string) => apiCallAuth(`/redirects/${id}`, { method: 'DELETE' }),
};

// Comment API calls
export const commentApi = {
  // Get all comments with filters (admin)
  list: async (filters?: { post_id?: string; status?: string; limit?: number; offset?: number }) => {
    return apiCallAuth('/comments', {
      headers: { 'X-Query': JSON.stringify(filters || {}) },
    });
  },
  
  // Get comments for a specific post (public - only approved comments)
  getForPost: (postId: string) => apiCall(`/posts/${postId}/comments`),
  
  // Create a new comment (public)
  create: (comment: {
    post_id: string;
    parent_id?: string;
    author_name: string;
    author_email: string;
    author_website?: string;
    content: string;
  }) => apiCallPublic('/comments', { method: 'POST', body: JSON.stringify(comment) }),
  
  // Update comment (admin - moderate, edit)
  update: (id: string, updates: any) => 
    apiCallAuth(`/comments/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  
  // Delete comment (admin)
  delete: (id: string) => apiCallAuth(`/comments/${id}`, { method: 'DELETE' }),
  
  // Bulk actions (admin)
  bulkAction: (action: 'approved' | 'rejected' | 'spam' | 'delete', ids: string[]) =>
    apiCallAuth('/comments/bulk', { 
      method: 'POST', 
      body: JSON.stringify({ action, ids }) 
    }),
  
  // Get comment statistics (admin)
  getStats: () => apiCallAuth('/comments/stats'),
};

// Helper function to handle query parameters in API calls
async function apiCallWithQuery<T = any>(endpoint: string, query?: Record<string, any>): Promise<T> {
  const queryString = query ? '?' + new URLSearchParams(query).toString() : '';
  return apiCall(endpoint + queryString);
}
