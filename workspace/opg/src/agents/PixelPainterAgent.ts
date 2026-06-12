import type { Env } from '../env';
import { createPixelDocument, applyPixelTool, exportDataURL } from '../pixel/canvas';

export interface PixelPainterOptions {
  width?: number;
  height?: number;
  palette?: string[];
}

export class PixelPainterAgent {
  constructor(private env: Env, private opts: PixelPainterOptions = {}) {}

  async init(gameId: string, prompt: string): Promise<{ docId: string; doc: ReturnType<typeof createPixelDocument> }> {
    const doc = createPixelDocument(this.opts.width, this.opts.height, this.opts.palette);
    const docId = crypto.randomUUID();
    await this.env.OPG_DB.prepare(
      'INSERT INTO pixel_documents (id, game_id, width, height, palette_json, layers_json, history_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(docId, gameId, doc.width, doc.height, JSON.stringify(doc.palette), JSON.stringify(doc.layers), JSON.stringify([]), Date.now(), Date.now()).run();
    return { docId, doc };
  }

  async applyTool(docId: string, tool: string, args: Record<string, unknown>): Promise<{ doc: ReturnType<typeof createPixelDocument>; preview?: string }> {
    const row = await this.env.OPG_DB.prepare('SELECT * FROM pixel_documents WHERE id = ?').bind(docId).first();
    if (!row) throw new Error('pixel_document not found');
    const doc = {
      ...row,
      layers: JSON.parse(row.layers_json as string),
      palette: JSON.parse(row.palette_json as string),
      history: JSON.parse((row.history_json as string) ?? '[]'),
    } as ReturnType<typeof createPixelDocument>;
    const next = applyPixelTool(doc, tool, args);
    const updated = { ...next, history: [...next.history, JSON.stringify({ tool, args, at: Date.now() })] };
    await this.env.OPG_DB.prepare(
      'UPDATE pixel_documents SET layers_json = ?, history_json = ?, updated_at = ? WHERE id = ?'
    ).bind(JSON.stringify(updated.layers), JSON.stringify(updated.history), Date.now(), docId).run();
    let preview: string | undefined;
    try {
      preview = await exportDataURL(updated);
    } catch {
      preview = undefined;
    }
    return { doc: updated, preview };
  }

  async continueChat(docId: string, message: string): Promise<{ summary: string }> {
    return { summary: `Processed chat continuation for ${docId}: ${message.slice(0, 120)}` };
  }
}
