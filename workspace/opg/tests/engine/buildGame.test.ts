import { describe, it, expect } from 'vitest';
import { buildGame } from '../../src/engine/buildGame';
import type { GameSpec } from '../../src/engine/GameSpec';

const spec: GameSpec = {
  id: 'test-game',
  title: 'Test',
  genre: 'platformer',
  style: 'snes',
  coreLoop: 'Jump',
  goal: 'Reach exit',
  difficulty: 'easy',
  mechanics: ['jump'],
  victoryCondition: 'reach exit',
  defeatCondition: 'touch enemy',
  assetRequirements: {
    player: { w: 16, h: 16, frames: 1, palette: ['#000'] },
    enemies: [],
    boss: null,
    items: [],
    tileset: { tileSize: 16, colors: ['#000', '#fff'] },
    background: { w: 320, h: 240 },
    ui: { icons: [] },
  },
  animations: [],
  level: { width: 10, height: 6, tileSize: 16 },
};

describe('buildGame', () => {
  it('builds HTML + manifest', async () => {
    const mockEnv = {
      OPG_DB: { prepare: () => ({ bind: () => ({ run: () => ({})}) })  },
      OPG_ASSETS: { put: async () => {}} ,
    } as any;
    const out = await buildGame(spec, mockEnv);
    expect(out.files).toHaveLength(2);
    expect(out.files.map(f => f.path)).toEqual([
      `builds/${spec.id}/index.html`,
      `builds/${spec.id}/manifest.json`,
    ]);
    const html = new TextDecoder().decode(out.files[0].content);
    expect(html).toContain('<canvas');
    expect(html).toContain('initGame');
    expect(html).toContain('LEVEL');
  });
});
