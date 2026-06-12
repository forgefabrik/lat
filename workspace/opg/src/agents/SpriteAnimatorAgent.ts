import { createAnimationDoc, addFrame, setFps, toGif } from '../../src/animation/index';

export interface SpriteAnimatorOptions {
  width?: number;
  height?: number;
  frameWidth?: number;
  frameHeight?: number;
  fps?: number;
  loop?: boolean;
}

export class SpriteAnimatorAgent {
  constructor(private opts: SpriteAnimatorOptions = {}) {}

  createDoc(prompt: string) {
    return createAnimationDoc({
      width: this.opts.width,
      height: this.opts.height,
      frameWidth: this.opts.frameWidth,
      frameHeight: this.opts.frameHeight,
      fps: this.opts.fps,
      loop: this.opts.loop,
    });
  }

  addKeyframes(doc: ReturnType<typeof this.createDoc>, count: number) {
    let current = doc;
    for (let i = 0; i < count; i += 1) current = addFrame(current);
    return current;
  }

  setAnimationFps(doc: ReturnType<typeof this.createDoc>, fps: number) {
    return setFps(doc, fps);
  }

  async generateGif(doc: ReturnType<typeof this.createDoc>): Promise<Uint8Array> {
    return toGif(doc);
  }

  cleanupFrames(doc: ReturnType<typeof this.createDoc>, duplicateIndices: number[]) {
    const byIndex = new Set(duplicateIndices);
    const next = { ...doc };
    next.layers = next.layers.map((layer) => ({
      ...layer,
      frames: layer.frames.filter((frame) => !byIndex.has(frame.index)),
    }));
    return next;
  }
}
