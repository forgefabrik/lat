import { validateGenerate, type GenerateRequest } from './validate';

export interface Env {
  AI: Ai;
  IMAGE_WORKER_SECRET: string;
  OPG_ASSETS: R2Bucket;
}

async function r2KeyFor(prompt: string, format: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(prompt));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `opg/global/${hex.slice(0, 16)}.${format}`;
}

interface GenerateResponse {
  ok: boolean;
  r2Key?: string;
  contentType?: string;
  width?: number;
  height?: number;
  error?: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method not allowed' }), {
        status: 405,
        headers: { 'content-type': 'application/json' },
      });
    }
    const auth = req.headers.get('x-image-worker-secret');
    if (auth !== env.IMAGE_WORKER_SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    let body: GenerateRequest;
    try {
      body = (await req.json()) as GenerateRequest;
    } catch {
      return new Response(JSON.stringify({ error: 'invalid json' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    const validation = validateGenerate(body);
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: validation.status,
        headers: { 'content-type': 'application/json' },
      });
    }
    const { prompt, width, height, format, style } = validation.req;
    try {
      const fullPrompt = style
        ? `${prompt}. Style: ${style}. Pixel art style, retro 16-bit, crisp edges, NO anti-aliasing, transparent background, NO extra text.`
        : `${prompt}. Pixel art style, retro 16-bit, crisp edges, NO anti-aliasing, transparent background, NO extra text.`;
      const aiInput = {
        prompt: fullPrompt,
        width,
        height,
        num_steps: 4,
      } as any;
      const aiResponse = (await (env.AI as any).run('@cf/black-forest-labs/FLUX.1-schnell', aiInput)) as {
        images: Array<{ base64?: string }>;
      };
      const image = aiResponse?.images?.[0];
      if (!image?.base64) {
        throw new Error('empty image response');
      }
      const buffer = Uint8Array.from(atob(image.base64), c => c.charCodeAt(0));
      const fmt = format ?? 'png';
      const r2Key = await r2KeyFor(prompt, fmt);
      await env.OPG_ASSETS.put(r2Key, buffer, {
        httpMetadata: { contentType: `image/${fmt}` },
      });
      const out: GenerateResponse = {
        ok: true,
        r2Key,
        contentType: `image/${fmt}`,
        width,
        height,
      };
      return new Response(JSON.stringify(out), {
        headers: { 'content-type': 'application/json' },
      });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      return new Response(JSON.stringify({ ok: false, error: msg }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }
  },
} satisfies ExportedHandler<Env>;
