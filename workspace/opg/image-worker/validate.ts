export interface GenerateRequest {
  prompt: string;
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  style?: string;
}

export function validateGenerate(
  body: unknown,
): { ok: true; req: GenerateRequest } | { ok: false; status: number; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, status: 400, error: 'invalid body' };
  }
  const b = body as Record<string, unknown>;
  const prompt = typeof b.prompt === 'string' ? b.prompt.trim() : '';
  if (!prompt) {
    return { ok: false, status: 400, error: 'prompt required' };
  }
  const width = typeof b.width === 'number' ? Math.max(8, Math.min(2048, b.width)) : 128;
  const height = typeof b.height === 'number' ? Math.max(8, Math.min(2048, b.height)) : 128;
  const format = ['png', 'jpeg'].includes(b.format as string) ? (b.format as 'png' | 'jpeg') : 'png';
  const style = typeof b.style === 'string' ? b.style : undefined;
  return { ok: true, req: { prompt, width, height, format, style } };
}
