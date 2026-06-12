export interface PixelLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  pixels: string[][];
}

export interface PixelDocument {
  id: string;
  width: number;
  height: number;
  palette: string[];
  layers: PixelLayer[];
  history: string[];
}

export function createPixelDocument(width = 16, height = 16, palette = ['#000000', '#ffffff']): PixelDocument {
  const pixels: string[][] = [];
  for (let y = 0; y < height; y += 1) {
    const row: string[] = [];
    for (let x = 0; x < width; x += 1) row.push(palette[0]);
    pixels.push(row);
  }
  return {
    id: crypto.randomUUID(),
    width,
    height,
    palette,
    layers: [
      {
        id: crypto.randomUUID(),
        name: 'layer-0',
        visible: true,
        opacity: 1,
        pixels,
      },
    ],
    history: [],
  };
}

export function clonePixelDocument(doc: PixelDocument): PixelDocument {
  return {
    ...doc,
    layers: doc.layers.map((layer) => ({
      ...layer,
      pixels: layer.pixels.map((row) => [...row]),
    })),
  };
}

export function applyPixelTool(
  doc: PixelDocument,
  tool: string,
  args: Record<string, unknown>,
  layerId?: string,
): PixelDocument {
  const next = clonePixelDocument(doc);
  const target = layerId
    ? next.layers.find((item) => item.id === layerId) ?? next.layers[next.layers.length - 1]
    : next.layers[next.layers.length - 1];
  if (!target) return doc;
  const pixels = target.pixels;

  switch (tool) {
    case 'draw_pixel': {
      const x = Number(args.x);
      const y = Number(args.y);
      const color = String(args.color ?? doc.palette[0]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return doc;
      if (y < 0 || y >= pixels.length || x < 0 || x >= (pixels[0]?.length ?? 0)) return doc;
      pixels[y][x] = color;
      break;
    }
    case 'fill_rect': {
      const x = Math.round(Number(args.x));
      const y = Math.round(Number(args.y));
      const w = Math.round(Number(args.width));
      const h = Math.round(Number(args.height));
      const color = String(args.color ?? doc.palette[0]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) return doc;
      for (let py = y; py < y + h && py < pixels.length; py += 1) {
        for (let px = x; px < x + w && px < (pixels[0]?.length ?? 0); px += 1) {
          pixels[py][px] = color;
        }
      }
      break;
    }
    case 'replace_color': {
      const from = String(args.from);
      const to = String(args.to);
      for (let py = 0; py < pixels.length; py += 1) {
        for (let px = 0; px < (pixels[0]?.length ?? 0); px += 1) {
          if (pixels[py][px] === from) pixels[py][px] = to;
        }
      }
      break;
    }
    case 'view_canvas':
    case 'get_pixel':
    case 'get_color_usage':
      break;
    default:
      return doc;
  }
  const historyEntry = JSON.stringify({ tool, args, layerId: target.id });
  return { ...next, history: [...next.history, historyEntry] };
}

export function undo(doc: PixelDocument): PixelDocument | null {
  if (doc.history.length === 0) return null;
  const next = { ...doc, history: doc.history.slice(0, -1) };
  return next;
}

export function redo(_doc: PixelDocument): PixelDocument | null {
  return null;
}

export function exportDataURL(doc: PixelDocument): string {
  const json = JSON.stringify({
    width: doc.width,
    height: doc.height,
    palette: doc.palette,
    layers: doc.layers.map((layer) => ({
      name: layer.name,
      pixels: layer.pixels,
    })),
  });
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `data:image/png;base64,${base64}`;
}
