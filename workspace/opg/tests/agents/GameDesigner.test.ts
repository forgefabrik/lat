import { describe, it, expect } from 'vitest';
import { GameDesignerAgent } from '../../src/agents/GameDesignerAgent';

describe('GameDesignerAgent', () => {
  it('produces a GameSpec from minimal input', async () => {
    const agent = new GameDesignerAgent({ OPG_DB: null as any, OPG_ASSETS: null as any, OPG_KV: null as any, OPG_QUEUE: null as any, ADMIN_KEY: '', SESSION_SECRET: '', KEY_ENCRYPTION_SECRET: '', IMAGE_WORKER_SECRET: '', IMAGE_WORKER_URL: '', APP_ENV: 'dev', PUBLIC_APP_NAME: 'OPG', ASSETS: null as any });
    const spec = await agent.design({ provider: 'kilo', apiKey: 'test', idea: 'frog knight in swamp', style: 'snes', template: 'platformer', quality: 'high' });
    expect(spec.title).toBe('frog knight in swamp');
    expect(spec.genre).toBe('platformer');
    expect(spec.assetRequirements.player.w).toBe(16);
  });
});
