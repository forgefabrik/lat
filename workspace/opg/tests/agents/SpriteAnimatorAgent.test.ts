import { describe, it, expect } from 'vitest';
import { SpriteAnimatorAgent } from '../../src/agents/SpriteAnimatorAgent';

describe('SpriteAnimatorAgent', () => {
  it('creates an animation document with prompt metadata', () => {
    const agent = new SpriteAnimatorAgent({ width: 16, height: 16, frameWidth: 16, frameHeight: 16, fps: 10 });
    const doc = agent.createDoc('walk cycle');
    expect(doc.fps).toBe(10);
    expect(doc.loop).toBe(true);
    expect(doc.layers).toHaveLength(1);
  });

  it('adds keyframes to the last layer', () => {
    const agent = new SpriteAnimatorAgent({ frameWidth: 8, frameHeight: 8 });
    const doc = agent.createDoc('idle');
    const withFrames = agent.addKeyframes(doc, 3);
    expect(withFrames.layers[0].frames).toHaveLength(4);
  });

  it('updates fps and preserves timeline count', () => {
    const agent = new SpriteAnimatorAgent();
    const doc = agent.createDoc('idle');
    const next = agent.setAnimationFps(doc, 24);
    expect(next.fps).toBe(24);
  });

  it('removes duplicate frames by index', () => {
    const agent = new SpriteAnimatorAgent({ frameWidth: 4, frameHeight: 4 });
    const doc = agent.createDoc('idle');
    const withFrames = agent.addKeyframes(doc, 2);
    const cleaned = agent.cleanupFrames(withFrames, [0, 2]);
    expect(cleaned.layers[0].frames).toHaveLength(1);
  });
});
