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
      difficulty: 'medium',
      coreLoop: 'Explore, survive, defeat boss',
      goal: 'Reach the boss and win',
      victoryCondition: 'Defeat the boss',
      defeatCondition: 'Player health reaches 0',
      mechanics: ['gravity', 'collision', 'items'],
      assetRequirements: {
        player: { w: 16, h: 16, frames: 4, palette: ['#000000', '#1a1a2e', '#3a9f4a', '#ffffff'] },
        enemies: [{ kind: 'slime', count: 6, w: 16, h: 16 }],
        boss: null,
        items: [{ kind: 'coin', count: 5 }],
        tileset: { tileSize: 16, colors: [] },
        background: { w: 320, h: 240 },
        ui: { icons: ['heart', 'coin'] },
      },
      animations: [],
      level: { width: 20, height: 12, tileSize: 16 },
    };

    return spec;
  }

  private titleFrom(idea: string): string {
    const words = idea.split(/\s+/).slice(0, 4).join(' ');
    return words || 'Untitled Game';
  }
}
