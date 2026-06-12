import type { Env } from '../env';
import { GameAgentOrchestrator } from '../agents/GameAgentOrchestrator';
import { AssetPlannerAgent } from '../agents/AssetPlannerAgent';
import { LevelDesignerAgent } from '../agents/LevelDesignerAgent';
import { buildGame } from '../engine/buildGame';
import { validateGameSpec } from '../engine/GameSpec';

const asOrch = (
  o: GameAgentOrchestrator
): { emit: any } =>
  o as unknown as { emit(...args: any[]): Promise<void> };

export interface QueueMessage {
  type: string;
  gameId: string;
  provider: string;
  apiKey: string;
  idea: string;
  style: string;
  template: string;
  quality: string;
}

export class OPQueueConsumer {
  constructor(private env: Env) {}

  async consume(batch: MessageBatch<QueueMessage>): Promise<void> {
    for (const msg of batch.messages) {
      const m = msg.body;
      if (m.type !== 'generate_game') {
        msg.ack();
        continue;
      }

        const orch = new GameAgentOrchestrator(this.env);
        const orch2 = asOrch(orch);

      try {
        const designResult = await this.runGameDesigner(m);
        const spec = designResult.spec;
        const validation = validateGameSpec(spec);
        if (!validation.ok) {
          await orch2.emit(m.gameId, '(job)', 'validation.error', { errors: validation.errors });
          await this.updateJob(m.gameId, 'failed', 0, 'Invalid spec');
          msg.ack();
          continue;
        }

        // 2. AssetPlannerAgent
        await orch2.emit(m.gameId, '(job)', 'agent.started', { agent: 'AssetPlannerAgent', message: 'Planning assets...' });
        const planner = new AssetPlannerAgent(this.env);
        await planner.plan(spec, m.gameId);

        // 3. LevelDesignerAgent
        await orch2.emit(m.gameId, '(job)', 'agent.started', { agent: 'LevelDesignerAgent', message: 'Generating level...' });
        const levelAgent = new LevelDesignerAgent(this.env);
        await levelAgent.generate(spec, m.gameId);

        // 4. CodeBuilderAgent
        await orch2.emit(m.gameId, '(job)', 'agent.started', { agent: 'CodeBuilderAgent', message: 'Building game...' });
        const build = await buildGame(spec, this.env);
        await this.saveBuild(build, m.gameId);

        await this.updateJob(m.gameId, 'completed', 100, 'Done');
        await orch2.emit(m.gameId, '(job)', 'job.completed', { gameId: m.gameId, buildId: build.gameId });
      } catch (e: any) {
        await this.updateJob(m.gameId, 'failed', 0, e?.message ?? 'unknown');
        await orch2.emit(m.gameId, '(job)', 'job.failed', { error: e?.message ?? String(e) });
      }

      msg.ack();
    }
  }

  private async runGameDesigner(m: QueueMessage): Promise<{ spec: any }> {
    // Inline a tiny spec generator that uses the provider (this is what the agent would normally do).
    // For now, build the spec deterministically from idea + template.
    const genre = (m.template === 'auto' ? guessGenre(m.idea) : m.template) as any;
    const spec = {
      id: m.gameId,
      title: m.idea.slice(0, 40),
      genre,
      style: m.style,
      coreLoop: 'Explore and reach the exit',
      goal: 'Defeat the boss or reach the exit',
      difficulty: 'medium',
      mechanics: genre === 'shooter' ? ['move', 'shoot'] : ['move', 'jump'],
      victoryCondition: 'Reach the exit',
      defeatCondition: 'Health reaches 0',
      assetRequirements: {
        player: { w: 16, h: 16, frames: 4, palette: ['#000000', '#1a1a2e', '#3a9f4a', '#ffffff'] },
        enemies: genre === 'boss_arena' || genre === 'platformer' ? [{ kind: 'slime', count: 3, w: 12, h: 12 }] : [],
        boss: ['boss_arena', 'platformer'].includes(genre) ? { w: 32, h: 32, phases: 2 } : null,
        items: [{ kind: 'coin', count: 5 }],
        tileset: { tileSize: 16, colors: ['#0f0f1a', '#16213e', '#0f3460', '#e94560', '#ffffff'] },
        background: { w: 320, h: 240 },
        ui: { icons: ['heart', 'coin'] },
      },
      animations: [{ name: 'idle', fps: 8, frames: 2, grid: { cols: 2, rows: 1 } }],
      level: { width: 20, height: 12, tileSize: 16 },
    };
    await this.env.OPG_DB.prepare(
      'INSERT INTO game_specs (id, game_id, version, spec_json, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), m.gameId, 1, JSON.stringify(spec), Date.now()).run();
    return { spec };
  }

  private async saveBuild(build: { gameId: string; r2Prefix: string; files: { path: string; content: Uint8Array }[] }, gameId: string) {
    const buildId = crypto.randomUUID();
    for (const f of build.files) {
    await this.env.OPG_ASSETS.put(f.path, f.content, {
        httpMetadata: {
          contentType: f.path.endsWith('.html') ? 'text/html' : (f.path.endsWith('.json') ? 'application/json' : 'application/octet-stream'),
        },
      });
    }
    await this.env.OPG_DB.prepare(
      'INSERT INTO builds (id, game_id, r2_key, status, manifest_json, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(buildId, gameId, `${build.r2Prefix}index.html`, 'ready', JSON.stringify(build), Date.now()).run();
  }

  private async updateJob(gameId: string, status: string, progress: number, message: string) {
    await this.env.OPG_DB.prepare('UPDATE jobs SET status=?, progress=?, message=?, updated_at=? WHERE game_id=? AND status != ?')
      .bind(status, progress, message, Date.now(), gameId, 'completed').run();
  }
}

function guessGenre(idea: string): string {
  const i = idea.toLowerCase();
  if (i.includes('shoot') || i.includes('space') || i.includes('galax')) return 'shooter';
  if (i.includes('rpg') || i.includes('quest') || i.includes('dungeon')) return 'rpg-lite';
  if (i.includes('collect') || i.includes('plattform') || i.includes('frog') || i.includes('jump')) return 'platformer';
  if (i.includes('top') || i.includes('overhead') || i.includes('zelda')) return 'topdown';
  if (i.includes('boss') || i.includes('arena')) return 'boss_arena';
  return 'platformer';
}