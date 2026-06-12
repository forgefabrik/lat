import { describe, it, expect } from 'vitest';
import { PixelPainterAgent } from '../../src/agents/PixelPainterAgent';

const db = {
  prepare: () => ({
    bind: () => ({
      run: async () => ({ lastInsertRowid: 1 }),
      first: async () => ({ id: 'doc-1', layers_json: JSON.stringify([{ id: 'layer-0', name: 'layer-0', visible: true, opacity: 1, pixels: [['#000']] }]), palette_json: JSON.stringify(['#000', '#fff']), history_json: '[]' }),
    }),
  }),
};

const env = {
  OPG_DB: db,
};

describe('PixelPainterAgent', () => {
  it('initializes a document', async () => {
    const agent = new PixelPainterAgent(env as any, { width: 8, height: 8, palette: ['#000', '#fff'] });
    const res = await agent.init('game-1', 'hello');
    expect(res.docId).toBeDefined();
    expect(res.doc.width).toBe(8);
    expect(res.doc.height).toBe(8);
    expect(res.doc.layers).toHaveLength(1);
    expect(res.doc.layers[0].pixels).toHaveLength(8);
    expect(res.doc.layers[0].pixels[0]).toHaveLength(8);
  });

  it('applies a tool', async () => {
    const agent = new PixelPainterAgent(env as any, { width: 8, height: 8, palette: ['#000', '#fff'] });
    const init = await agent.init('game-1', 'hello');
    const res = await agent.applyTool(init.docId, 'draw_pixel', { x: 0, y: 0, color: '#ff0000' });
    expect(res).toBeDefined();
    expect(res.doc.layers[0].pixels[0][0]).toBe('#ff0000');
  });

  it('continues chat', async () => {
    const agent = new PixelPainterAgent(env as any);
    const out = await agent.continueChat('doc-1', 'make it redder');
    expect(out.summary).toContain('doc-1');
  });
});
