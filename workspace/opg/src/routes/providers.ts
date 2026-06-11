export async function handleProviderTest(req: Request, _env: any): Promise<Response> {
  try {
    const body = (await req.json()) as { provider: string; apiKey: string };
    return Response.json({ ok: false, provider: body.provider, error: 'provider not configured' });
  } catch {
    return Response.json({ ok: false, provider: 'unknown', error: 'invalid request body' }, { status: 400 });
  }
}

export async function handleProviderList(_req: Request, _env: any): Promise<Response> {
  return Response.json({ providers: [] });
}
