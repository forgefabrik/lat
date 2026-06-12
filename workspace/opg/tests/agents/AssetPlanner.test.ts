import { describe, it, expect, vi } from 'vitest';
import { AssetPlannerAgent, AssetPlan } from '../../src/agents/AssetPlannerAgent';
import type { Env } from '../../src/env';
import type { GameSpec } from '../../src/engine/GameSpec';

// Mock Env with OPG_DB
const mockDB = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({ run: vi.fn() })),
  })),
};
const mockEnv: Env = { OPG_DB: mockDB as any };

const sampleSpec: GameSpec = {
  title: 'Test Game',
  genre: 'platformer',
  style: 'snes',
  assetRequirements: {
    player: { w: 16, h: 16 },
    enemies: [{ kind: 'goomba' }],
    boss: true,
    items: [{ kind: 'coin' }],
    tileset: { colors: ['#000', '#fff'] },
  },
  level: { width: 20, height: 15, tileSize: 16 },
};

describe('AssetPlannerAgent', () => {
  it('plan returns AssetPlan with required assets and inserts into DB', async () => {
    const agent = new AssetPlannerAgent(mockEnv as any);
    const plan = await agent.plan(sampleSpec, 'game-123');
    expect(plan.required.length).toBeGreaterThan(0);
    expect(mockDB.prepare).toHaveBeenCalledWith(
      'INSERT INTO assets (id, game_id, kind, name, r2_key, prompt, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    expect(plan.prompts).toHaveProperty('player_idle');
    expect(plan.prompts['player_idle']).toContain('snes');
  });
});
