export interface AnimationFrame {
  index: number;
  durationMs: number;
  pixels: string[];
}

export interface AnimationLayer {
  id: string;
  name: string;
  frames: AnimationFrame[];
}

export interface TimelineAction {
  id: string;
  kind: 'frame' | 'fps' | 'loop';
  frameIndex?: number;
  fps?: number;
  loop?: boolean;
  at: number;
}

export interface AnimationDoc {
  id: string;
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  layers: AnimationLayer[];
  timeline: TimelineAction[];
  fps: number;
  loop: boolean;
}

export function createAnimationDoc(opts: {
  width?: number;
  height?: number;
  frameWidth?: number;
  frameHeight?: number;
  fps?: number;
  loop?: boolean;
} = {}): AnimationDoc {
  const width = opts.width ?? 16;
  const height = opts.height ?? 16;
  const frameWidth = opts.frameWidth ?? width;
  const frameHeight = opts.frameHeight ?? height;
  const emptyPixels = Array.from({ length: frameWidth * frameHeight }, () => '#000000');
  return {
    id: crypto.randomUUID(),
    width,
    height,
    frameWidth,
    frameHeight,
    layers: [
      {
        id: crypto.randomUUID(),
        name: 'layer-0',
        frames: [
          {
            index: 0,
            durationMs: 100,
            pixels: emptyPixels,
          },
        ],
      },
    ],
    timeline: [],
    fps: opts.fps ?? 12,
    loop: opts.loop ?? true,
  };
}

export function cloneAnimationDoc(doc: AnimationDoc): AnimationDoc {
  return {
    ...doc,
    layers: doc.layers.map((layer) => ({
      ...layer,
      frames: layer.frames.map((frame) => ({
        ...frame,
        pixels: [...frame.pixels],
      })),
    })),
    timeline: [...doc.timeline],
  };
}

export function addFrame(doc: AnimationDoc, layerId?: string): AnimationDoc {
  const next = cloneAnimationDoc(doc);
  const target = layerId
    ? next.layers.find((item) => item.id === layerId) ?? next.layers[next.layers.length - 1]
    : next.layers[next.layers.length - 1];
  if (!target) return doc;
  const nextIndex = target.frames.length;
  target.frames.push({
    index: nextIndex,
    durationMs: 100,
    pixels: Array.from({ length: next.frameWidth * next.frameHeight }, () => '#000000'),
  });
  next.timeline = [...next.timeline, { id: crypto.randomUUID(), kind: 'frame', frameIndex: nextIndex, at: Date.now() }];
  return next;
}

export function setFps(doc: AnimationDoc, fps: number): AnimationDoc {
  const next = cloneAnimationDoc(doc);
  next.fps = Math.max(1, Math.round(fps));
  next.timeline = [...next.timeline, { id: crypto.randomUUID(), kind: 'fps', fps: next.fps, at: Date.now() }];
  return next;
}

export function toGif(doc: AnimationDoc): Uint8Array {
  const frames = doc.layers.flatMap((layer) => layer.frames);
  const size = doc.frameWidth * doc.frameHeight;
  const header = new TextEncoder().encode(
    `GIF89a${String.fromCharCode(doc.frameWidth, 0, doc.frameHeight, 0, 0xF7, 0, 0, 0xFF, 0xFF, 0xFF, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00)}`,
  );
  const pixels = frames.flatMap((frame) => frame.pixels).slice(0, size * frames.length);
  const body = new Uint8Array([...header, ...pixels.map((p) => (typeof p === 'string' ? 0 : p)), 0x3B]);
  return body;
}
