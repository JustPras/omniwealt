// Supabase Edge Function: gemini-proxy
// Calls Google Gemini AI server-side so the API key never ships in the client bundle.
// Env vars (set in Supabase dashboard / supabase secrets):
//   GEMINI_API_KEY  (server-side secret, NOT EXPO_PUBLIC_*)
//
// Deploy:
//   supabase functions deploy gemini-proxy --project-ref <ref>
//   supabase secrets set GEMINI_API_KEY=<your-key>

import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-1.5-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'not_configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { prompt, inlineData } = body;
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'missing_prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL });

    let contentInput: any = prompt;
    if (inlineData && inlineData.data && inlineData.mimeType) {
      contentInput = [
        prompt,
        {
          inlineData: {
            data: inlineData.data,
            mimeType: inlineData.mimeType,
          },
        },
      ];
    }

    const result = await model.generateContent(contentInput);
    const text = result.response.text();

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'upstream_failed', detail: String(e) }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
