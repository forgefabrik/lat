export function validateBuild(buildArtifacts: { files: { path: string; content: Uint8Array }[] }): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const html = buildArtifacts.files.find(f => f.path.endsWith('.html'));
  if (!html) errors.push('missing index.html');
  else {
    const text = new TextDecoder().decode(html.content);
    if (!text.includes('<canvas')) errors.push('no canvas in html');
    if (!text.includes('initGame')) errors.push('no initGame entrypoint');
    if (!text.includes('LEVEL')) errors.push('no LEVEL JSON');
  }
  const manifest = buildArtifacts.files.find(f => f.path.endsWith('manifest.json'));
  if (!manifest) errors.push('missing manifest.json');
  return { ok: errors.length === 0, errors };
}