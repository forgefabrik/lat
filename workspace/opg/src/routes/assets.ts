import type { Env } from '../env';

export async function handlePreview(_req: Request, env: Env): Promise<Response> {
  return Response.json({ preview: 'pending', message: 'Milestone 14-15 required' }, { status: 202 });
}

export async function handlePixelContinue(req: Request, _env: Env): Promise<Response> {
  return Response.json({ continued: false, message: 'Milestone 6-8 required' }, { status: 202 });
}

export async function handleAnimationGenerate(req: Request, _env: Env): Promise<Response> {
  return Response.json({ generated: false, message: 'Milestone 7-8 required' }, { status: 202 });
}

export async function handleAssetRegenerate(req: Request, _env: Env): Promise<Response> {
  return Response.json({ regenerated: false, message: 'Milestone 12 required' }, { status: 202 });
}
