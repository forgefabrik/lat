import { describe, it, expect } from 'vitest';
import { validateGameSpec, GameSpec } from '../src/engine/GameSpec';

const validSpec: GameSpec = {
  id: crypto.randomUUID(),
  title: 'Test',
  genre: 'platformer',
  style: 'snes',
  coreLoop: 'Jump and fight',
  goal: 'Defeat boss',
  difficulty: 'medium',
  mechanics: ['jump', 'attack'],
  victoryCondition: 'Boss dies',
  defeatCondition: 'Player dies',
  assetRequirements: {
    player: { w: 16, h: 16, frames: 4, palette: ['#000', '#fff'] },
    enemies: [{ kind: 'slime', count: 3, w: 12, h: 12 }],
    boss: { w: 32, h: 32, phases: 2 },
    items: [{ kind: 'coin', count: 5 }],
    tileset: { tileSize: 16, colors: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'] },
    background: { w: 320, h: 240 },
    ui: { icons: ['heart', 'coin', 'key'] },
  },
  animations: [{ name: 'walk', fps: 10, frames: 4, grid: { cols: 4, rows: 1 } }],
  level: { width: 40, height: 12, tileSize: 16 },
};

describe('validateGameSpec', () => {
  it('accepts valid spec', () => {
    const r = validateGameSpec(validSpec);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it('rejects empty input', () => {
    expect(validateGameSpec(null).ok).toBe(false);
    expect(validateGameSpec({}).ok).toBe(false);
  });

  it('rejects invalid genre', () => {
    const bad = { ...validSpec, genre: 'tetris' as any };
    expect(validateGameSpec(bad).ok).toBe(false);
    expect(validateGameSpec(bad).errors.some((e) => e.includes('genre'))).toBe(true);
  });

  it('rejects missing assetRequirements', () => {
    const bad = { ...validSpec, assetRequirements: undefined };
    expect(validateGameSpec(bad).ok).toBe(false);
  });
});
