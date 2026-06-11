export type Genre = 'platformer' | 'topdown' | 'shooter' | 'rpg-lite' | 'collectathon' | 'boss_arena';

export interface GameSpec {
  id: string;
  title: string;
  genre: Genre;
  style: string;
  coreLoop: string;
  goal: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mechanics: string[];
  victoryCondition: string;
  defeatCondition: string;
  assetRequirements: {
    player: { w: number; h: number; frames: number; palette: string[] };
    enemies: { kind: string; count: number; w: number; h: number }[];
    boss: { w: number; h: number; phases: number } | null;
    items: { kind: string; count: number }[];
    tileset: { tileSize: number; colors: string[] };
    background: { w: number; h: number };
    ui: { icons: string[] };
  };
  animations: { name: string; fps: number; frames: number; grid: { cols: number; rows: number } }[];
  level: { width: number; height: number; tileSize: number };
}

export function validateGameSpec(spec: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!spec || typeof spec !== 'object') return { ok: false, errors: ['spec missing'] };
  const s = spec as Partial<GameSpec>;
  if (typeof s.id !== 'string' || s.id.length < 1) errors.push('id missing');
  if (typeof s.title !== 'string' || s.title.length < 1) errors.push('title missing');
  if (!['platformer', 'topdown', 'shooter', 'rpg-lite', 'collectathon', 'boss_arena'].includes(s.genre as Genre)) errors.push('genre invalid');
  if (!s.assetRequirements) errors.push('assetRequirements missing');
  else {
    const ar = s.assetRequirements as any;
    if (!ar.player) errors.push('assetRequirements.player missing');
    if (!ar.tileset) errors.push('assetRequirements.tileset missing');
  }
  return { ok: errors.length === 0, errors };
}
