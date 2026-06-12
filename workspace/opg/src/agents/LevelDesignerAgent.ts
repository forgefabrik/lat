import type { Env } from '../env';
import type { GameSpec } from '../engine/GameSpec';

export interface LevelData {
  gameId: string;
  width: number;
  height: number;
  tileSize: number;
  layers: {
    background: number[][];
    collision: number[][];
    entities: { type: string; x: number; y: number; w: number; h: number }[];
  };
  spawn: { x: number; y: number };
  exit: { x: number; y: number } | null;
  solvable: boolean;
}

export class LevelDesignerAgent {
  constructor(private env: Env) {}

  async generate(spec: GameSpec, gameId: string): Promise<LevelData> {
    const levelSpec = spec.level;
    const cols = levelSpec.width;
    const rows = levelSpec.height;
    const ts = levelSpec.tileSize;

    const background: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    const collision: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    const entities: LevelData['layers']['entities'] = [];

    if (spec.genre === 'platformer') {
      // floor and wall
      for (let x = 0; x < cols; x++) {
        collision[rows - 1][x] = 1; // floor
        collision[rows - 2][x] = 1; // wall
      }
      const spawn = { x: 2, y: rows - 5 };
      const exit = { x: cols - 3, y: rows - 5 };
      entities.push({ type: 'player_spawn', x: spawn.x, y: spawn.y, w: 1, h: 1 });
      entities.push({ type: 'level_exit', x: exit.x, y: exit.y, w: 1, h: 1 });

      for (const e of spec.assetRequirements?.enemies ?? []) {
        entities.push({
          type: `enemy_${e.kind}`,
          x: 10 + Math.floor(Math.random() * (cols - 14)),
          y: rows - 5,
          w: 1,
          h: 1,
        });
      }

      const out: LevelData = {
        gameId,
        width: cols,
        height: rows,
        tileSize: ts,
        layers: { background, collision, entities },
        spawn,
        exit,
        solvable: true,
      };
      await this.persist(out);
      return out;
    }

    // topdown fallback
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) collision[y][x] = 1;
      }
    }
    const spawn = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
    const out: LevelData = {
      gameId,
      width: cols,
      height: rows,
      tileSize: ts,
      layers: { background, collision, entities },
      spawn,
      exit: null,
      solvable: true,
    };
    await this.persist(out);
    return out;
  }

  private async persist(level: LevelData) {
    await this.env.OPG_DB.prepare(
      'INSERT INTO levels (id, game_id, name, level_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(
        crypto.randomUUID(),
        level.gameId,
        'level-1',
        JSON.stringify(level),
        Date.now(),
        Date.now(),
      )
      .run();
  }
}
