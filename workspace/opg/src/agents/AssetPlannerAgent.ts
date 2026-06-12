import type { Env } from '../env';
import type { GameSpec } from '../engine/GameSpec';
import type { TemplateName, TemplateManifest } from '../engine/templates';

export interface AssetPlan {
  gameId: string;
  required: string[];
  optional: string[];
  prompts: Record<string, string>;
  palette: string[];
}

export class AssetPlannerAgent {
  constructor(private env: Env) {}

  async plan(gameSpec: GameSpec, gameId: string): Promise<AssetPlan> {
    const template = gameSpec.genre as TemplateName;
    const manifest: TemplateManifest = {
      name: template,
      features: [],
      mechanics: [],
      requiredAssets: gameSpec.assetRequirements
        ? [
            `player_${gameSpec.assetRequirements.player ? 'idle' : 'idle'}`,
            ...(gameSpec.assetRequirements.enemies?.length
              ? [`enemy_${gameSpec.assetRequirements.enemies[0].kind}`]
              : []),
            ...(gameSpec.assetRequirements.boss ? ['boss_idle'] : []),
            ...(gameSpec.assetRequirements.items?.length
              ? [`item_${gameSpec.assetRequirements.items[0].kind}`]
              : []),
            'tileset',
            'background',
            'ui_icons',
          ]
        : [],
      engineApi: [],
    };

    const required = manifest.requiredAssets;
    const optional: string[] = [];
    const palette = gameSpec.assetRequirements?.tileset?.colors ?? [
      '#000000',
      '#1a1a2e',
      '#16213e',
      '#0f3460',
      '#e94560',
      '#ffffff',
    ];

    const prompts: Record<string, string> = {};
    for (const asset of required) {
      prompts[asset] = this.promptFor(asset, gameSpec);
    }

    const plan: AssetPlan = { gameId, required, optional, prompts, palette };

    await this.env.OPG_DB.prepare(
      'INSERT INTO assets (id, game_id, kind, name, r2_key, prompt, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        crypto.randomUUID(),
        gameId,
        'plan',
        'asset-plan',
        '',
        JSON.stringify(plan),
        gameSpec.assetRequirements?.player?.w ?? 16,
        gameSpec.assetRequirements?.player?.h ?? 16,
        Date.now(),
      )
      .run();

    return plan;
  }

  private promptFor(asset: string, spec: GameSpec): string {
    const style = spec.style ?? 'snes';
    const map: Record<string, string> = {
      player_idle: `pixel art ${style} player character idle pose, 16x16, transparent background`,
      player_walk: `pixel art ${style} player walk cycle frame, 16x16, transparent background`,
      player_jump: `pixel art ${style} player jump frame, 16x16, transparent background`,
      player_attack: `pixel art ${style} player attack frame, 16x16, transparent background`,
      enemy_idle: `pixel art ${style} enemy idle sprite, 16x16, transparent background`,
      enemy_walk: `pixel art ${style} enemy walk cycle, 16x16, transparent background`,
      boss_idle: `pixel art ${style} boss idle, 32x32, transparent background`,
      boss_attack: `pixel art ${style} boss attack, 32x32, transparent background`,
      item_coin: `pixel art ${style} coin item, 8x8, transparent background`,
      item_gem: `pixel art ${style} gem item, 8x8, transparent background`,
      item_key: `pixel art ${style} key item, 8x8, transparent background`,
      tileset: `pixel art ${style} tileset, 16x16 tiles, seamless, transparent background`,
      background: `pixel art ${style} background, ${spec.title}, 320x240, parallax-friendly, transparent background`,
      ui_icons: `pixel art ${style} HUD icons (heart, coin, key), 8x8 each, transparent background`,
    };
    return map[asset] ?? `pixel art ${style} ${asset}, 16x16, transparent background`;
  }
}
