// Centralized Gemini Service via Supabase Edge Function Proxy
// Keeps GEMINI_API_KEY secure on the server side.
// Falls back to direct SDK only if edge proxy is unreachable or unconfigured.

import { GoogleGenerativeAI } from '@google/generative-ai';

declare const process: any;

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const DIRECT_GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export interface GeminiProxyPayload {
  prompt: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
}

export const GeminiProxyService = {
  /**
   * Check whether any Gemini backend (Proxy or Direct fallback) is available
   */
  isConfigured(): boolean {
    const hasProxy = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
    const hasDirect = Boolean(DIRECT_GEMINI_KEY);
    return hasProxy || hasDirect;
  },

  /**
   * Execute prompt via Supabase Edge Function Proxy.
   * If Edge Function is unavailable or fails, gracefully falls back to direct SDK if key exists.
   */
  async generateContent(payload: GeminiProxyPayload): Promise<string> {
    // 1. Try Supabase Edge Function Proxy First (Secure Server-Side Path)
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const edgeFnUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/gemini-proxy`;
        const res = await fetch(edgeFnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = await res.json();
          if (json && typeof json.text === 'string') {
            return json.text;
          }
        } else {
          console.warn(`[GeminiProxy] Edge proxy status ${res.status}, checking fallback...`);
        }
      } catch (err) {
        console.warn('[GeminiProxy] Edge proxy fetch error:', err);
      }
    }

    // 2. Fallback to Direct Client-side SDK (if dev key provided)
    if (DIRECT_GEMINI_KEY) {
      const genAI = new GoogleGenerativeAI(DIRECT_GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      let contentInput: any = payload.prompt;
      if (payload.inlineData) {
        contentInput = [
          payload.prompt,
          {
            inlineData: payload.inlineData,
          },
        ];
      }

      const result = await model.generateContent(contentInput);
      return result.response.text();
    }

    throw new Error('Gemini service is not configured (neither Supabase Edge Proxy nor Direct Key).');
  },
};
