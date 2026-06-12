import type { Env } from '../env';
import type { GameSpec } from '../engine/GameSpec';
import { buildGame } from '../engine/buildGame';

export class CodeBuilderAgent {
  constructor(private env: Env) {}

  async build(gameSpec: GameSpec): Promise<{ buildId: string; previewUrl: string }> {
    const build = await buildGame(gameSpec, this.env);
    const buildId = crypto.randomUUID();
    for (const f of build.files) {
      await this.env.OPG_ASSETS.put(f.path, f.content, {
        httpMetadata: {
          contentType: f.path.endsWith('.html') ? 'text/html' : (f.path.endsWith('.json') ? 'application/json' : 'application/octet-stream'),
        },
      });
    }
    await this.env.OPG_DB.prepare(
      'INSERT INTO builds (id, game_id, r2_key, status, manifest_json, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(buildId, gameSpec.id, `${build.r2Prefix}index.html`, 'ready', JSON.stringify(build), Date.now()).run();
    const previewUrl = `/api/games/${gameSpec.id}/preview`;
    return { buildId, previewUrl };
  }
}