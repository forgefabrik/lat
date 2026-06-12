import { describe, it, expect, vi } from 'vitest';
import { LevelDesignerAgent } from '../../src/agents/LevelDesignerAgent';
import type { Env } from '../../src/env';
import type { GameSpec } from '../../src/engine/GameSpec';

const mockDB = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({ run: vi.fn() })),
  })),
};
const mockEnv: Env = { OPG_DB: mockDB as any };

const platformerSpec: GameSpec = {
  title: 'Plat Game',
  genre: 'platformer',
  style: 'snes',
  assetRequirements: {
    player: { w: 16, h: 16 },
    enemies: [{ kind: 'goomba' }],
    boss: false,
    items: [],
    tileset: { colors: [] },
  },
  level: { width: 10, height: 8, tileSize: 16 },
};

describe('LevelDesignerAgent', () => {
  it('generates platformer level with floor and spawn', async () => {
    const agent = new LevelDesignerAgent(mockEnv as any);
    const level = await agent.generate(platformerSpec, 'game-456');
    expect(level.width).toBe(10);
    expect(level.height).toBe(8);
    // floor row should have collision=1
    expect(level.layers.collision[7][0]).toBe(1);
    // spawn defined
    expect(level.spawn).toEqual({ x: 2, y: 3 });
    // exit defined
    expect(level.exit).toEqual({ x: 7, y: 3 });
    expect(mockDB.prepare).toHaveBeenCalled();
  });
});
