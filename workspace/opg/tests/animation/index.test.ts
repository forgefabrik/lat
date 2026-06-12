import { describe, it, expect } from 'vitest';
import { createAnimationDoc, addFrame, setFps, toGif } from '../../src/animation/index';

describe('animation/index', () => {
  it('creates a default animation document', () => {
    const doc = createAnimationDoc({ width: 16, height: 16, frameWidth: 16, frameHeight: 16 });
    expect(doc.id).toBeDefined();
    expect(doc.width).toBe(16);
    expect(doc.height).toBe(16);
    expect(doc.frameWidth).toBe(16);
    expect(doc.frameHeight).toBe(16);
    expect(doc.fps).toBe(12);
    expect(doc.loop).toBe(true);
    expect(doc.layers).toHaveLength(1);
    expect(doc.layers[0].frames).toHaveLength(1);
    expect(doc.layers[0].frames[0].pixels).toHaveLength(256);
  });

  it('adds a frame to the last layer', () => {
    const doc = createAnimationDoc({ frameWidth: 8, frameHeight: 8 });
    const withFrame = addFrame(doc);
    expect(withFrame.layers[0].frames).toHaveLength(2);
    expect(withFrame.layers[0].frames[1].index).toBe(1);
    expect(withFrame.layers[0].frames[1].pixels).toHaveLength(64);
    expect(withFrame.timeline).toHaveLength(1);
  });

  it('sets a minimum fps of 1', () => {
    const doc = createAnimationDoc();
    const clamped = setFps(doc, -4);
    expect(clamped.fps).toBe(1);
  });

  it('exports a gif buffer with trailer', () => {
    const doc = createAnimationDoc({ width: 4, height: 4, frameWidth: 4, frameHeight: 4, fps: 8 });
    const buffer = toGif(doc);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer[buffer.length - 1]).toBe(0x3B);
  });
});
