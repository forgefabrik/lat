import { describe, it, expect } from 'vitest';
import { buildGame, saveBuild } from '../../src/engine/buildGame';
import type { GameSpec } from '../../src/engine/GameSpec';

const spec: GameSpec = {
  id: 'integration-test',
  title: 'IT',
  genre: 'topdown',
  style: 'gb',
  coreLoop: 'x',
  goal: 'x',
  difficulty: 'easy',
  mechanics: [],
  victoryCondition: 'x',
  defeatCondition: 'x',
  assetRequirements: {
    player: { w: 16, h: 16, frames: 1, palette: [] },
    enemies: [],
    boss: null,
    items: [],
    tileset: { tileSize: 16, colors: [] },
    background: { w: 160, h: 144 },
    ui: { icons: [] },
  },
  animations: [],
  level: { width: 10, height: 6, tileSize: 16 },
};

describe('buildGame integration', () => {
  it('returns 2 files and includes canvas + initGame', async () => {
    const mockEnv = {
      OPG_DB: { prepare: () => ({ bind: () => ({ run: async () => ({})}) })  },
      OPG_ASSETS: { put: async () => {}} ,
    } as any;
    const out = await buildGame(spec, mockEnv);
    expect(out.files.length).toBeGreaterThanOrEqual(2);
    const html = new TextDecoder().decode(out.files.find(f => f.path.endsWith('.html'))!.content);
    expect(html).toContain('<canvas');
    expect(html).toContain('initGame');
    expect(html).toContain('LEVEL');
  });
});