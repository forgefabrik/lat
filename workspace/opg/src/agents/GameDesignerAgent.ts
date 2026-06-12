import type { Env } from '../env';
import type { GameSpec } from '../engine/GameSpec';

export class GameDesignerAgent {
  constructor(private env: Env) {}

  async design(input: { provider: string; apiKey: string; idea: string; style: string; template: string; quality: string }): Promise<GameSpec> {
    const template = input.template || 'auto';
    const style = input.style || 'snes';
    const quality = input.quality || 'medium';

    const spec: GameSpec = {
      id: crypto.randomUUID(),
      title: this.titleFrom(input.idea),
      genre: template === 'auto' ? 'platformer' : (template as GameSpec['genre']),
      style,
      quality,
      difficulty: 2,
      coreLoop: 'Explore, survive, defeat boss',
      goal: 'Reach the boss and win',
      player: { kind: 'hero', hp: 3, speed: 2, jump: 6 },
      enemies: [{ kind: 'slime', count: 6 }],
      mechanics: ['gravity', 'collision', 'items'],
      assetRequirements: {
        player: { kind: 'hero_idle', w: 16, h: 16 },
        enemies: [{ kind: 'slime_idle', w: 16, h: 16 }],
        tileset: { w: 16, h: 16, colors: [] },
        background: { w: 320, h: 240 },
        ui_icons: [],
      },
      palette: ['#000000', '#1a1a2e', '#16213e', '#0f3460', '#4ade80', '#e94560', '#ffffff'],
    };

    return spec;
  }

  private titleFrom(idea: string): string {
    const words = idea.split(/\s+/).slice(0, 4).join(' ');
    return words || 'Untitled Game';
  }
}
