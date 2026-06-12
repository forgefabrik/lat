import { describe, it, expect } from 'vitest';
import { validateBuild } from '../../src/engine/validateBuild';

describe('validateBuild', () => {
  it('passes on complete build', () => {
    const r = validateBuild({
      files: [
        { path: 'builds/x/index.html', content: new TextEncoder().encode('<html><canvas id="c"></canvas><script>const LEVEL={};window.initGame=function(){})();</script></html>') },
        { path: 'builds/x/manifest.json', content: new TextEncoder().encode('{}') },
      ],
    });
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it('rejects missing files', () => {
    expect(validateBuild({ files: [] }).ok).toBe(false);
    expect(validateBuild({ files: [{ path: 'x.html', content: new Uint8Array() }] }).errors).toContain('missing manifest.json');
  });
});