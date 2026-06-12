import { describe, it, expect } from 'vitest';
import { createPixelDocument, applyPixelTool, undo, exportDataURL } from '../../src/pixel/canvas';

describe('pixel canvas', () => {
  it('creates a default document', () => {
    const doc = createPixelDocument();
    expect(doc.width).toBe(16);
    expect(doc.height).toBe(16);
    expect(doc.layers.length).toBe(1);
    expect(doc.layers[0].pixels.length).toBe(16);
    expect(doc.layers[0].pixels[0].length).toBe(16);
  });

  it('creates a custom size document', () => {
    const doc = createPixelDocument(32, 8);
    expect(doc.width).toBe(32);
    expect(doc.height).toBe(8);
    expect(doc.layers[0].pixels.length).toBe(8);
    expect(doc.layers[0].pixels[0].length).toBe(32);
  });

  it('applies draw_pixel', () => {
    const doc = createPixelDocument();
    const next = applyPixelTool(doc, 'draw_pixel', { x: 0, y: 0, color: '#ff0000' });
    expect(next.layers[0].pixels[0][0]).toBe('#ff0000');
    expect(next.history.length).toBe(1);
  });

  it('ignores out-of-bounds draw_pixel', () => {
    const doc = createPixelDocument();
    const next = applyPixelTool(doc, 'draw_pixel', { x: -1, y: 0, color: '#ff0000' });
    expect(next.layers[0].pixels[0][0]).toBe(doc.layers[0].pixels[0][0]);
    expect(next.history.length).toBe(0);
  });

  it('applies fill_rect', () => {
    const doc = createPixelDocument(8, 8);
    const next = applyPixelTool(doc, 'fill_rect', { x: 1, y: 1, width: 2, height: 2, color: '#00ff00' });
    for (let y = 1; y < 3; y++) {
      for (let x = 1; x < 3; x++) {
        expect(next.layers[0].pixels[y][x]).toBe('#00ff00');
      }
    }
  });

  it('applies replace_color', () => {
    const doc = createPixelDocument(4, 4, ['#000000', '#ffffff']);
    const drawn = applyPixelTool(doc, 'draw_pixel', { x: 0, y: 0, color: '#ffffff' });
    const replaced = applyPixelTool(drawn, 'replace_color', { from: '#ffffff', to: '#ff00ff' });
    expect(replaced.layers[0].pixels[0][0]).toBe('#ff00ff');
  });

  it('undo removes last history entry', () => {
    const doc = createPixelDocument();
    const withOp = applyPixelTool(doc, 'draw_pixel', { x: 0, y: 0, color: '#ff0000' });
    const undone = undo(withOp);
    expect(undone?.history.length).toBe(0);
  });

  it('exportDataURL returns a data url string', () => {
    const doc = createPixelDocument();
    const url = exportDataURL(doc);
    expect(typeof url).toBe('string');
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
  });
});
