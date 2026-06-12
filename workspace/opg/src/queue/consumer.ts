import type { Env } from '../env';
import { GameAgentOrchestrator } from '../agents/GameAgentOrchestrator';
import { AssetPlannerAgent } from '../agents/AssetPlannerAgent';
import { LevelDesignerAgent } from '../agents/LevelDesignerAgent';
import { buildGame } from '../engine/buildGame';
import { validateGameSpec } from '../engine/GameSpec';

const asOrch = (
  o: GameAgentOrchestrator
): { emit: (...args: any[]) => Promise<void> } =>
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
      const emit = asOrch(orch).emit.bind(orch);

      try {
        await emit(m.gameId, '(job)', 'agent.started', { agent: 'GameDesignerAgent', message: 'Designing game...' });

        const designResult = await this.runGameDesigner(m);
        const spec = designResult.spec;
        const validation = validateGameSpec(spec);
        if (!validation.ok) {
          await emit(m.gameId, '(job)', 'validation.error', { errors: validation.errors });
          await this.updateJob(m.gameId, 'failed', 0, 'Invalid spec');
          msg.ack();
          continue;
        }

        await emit(m.gameId, '(job)', 'agent.started', { agent: 'AssetPlannerAgent', message: 'Planning assets...' });
        const planner = new AssetPlannerAgent(this.env);
        await planner.plan(spec, m.gameId);

        await emit(m.gameId, '(job)', 'agent.started', { agent: 'LevelDesignerAgent', message: 'Generating level...' });
        const levelAgent = new LevelDesignerAgent(this.env);
        await levelAgent.generate(spec, m.gameId);

        await emit(m.gameId, '(job)', 'agent.started', { agent: 'CodeBuilderAgent', message: 'Building game...' });
        const build = await buildGame(spec, this.env);
        await this.saveBuild(build, m.gameId);

        await this.updateJob(m.gameId, 'completed', 100, 'Done');
        await emit(m.gameId, '(job)', 'job.completed', { gameId: m.gameId, buildId: build.gameId });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'unknown';
        await this.updateJob(m.gameId, 'failed', 0, message);
        await emit(m.gameId, '(job)', 'job.failed', { error: message });
      }

      msg.ack();
    }
  }

  private async runGameDesigner(m: QueueMessage): Promise<{ spec: any }> {
    const genre = (m.template === 'auto' ? guessGenre(m.idea) : m.template) as any;
    const prompt = this.buildSpecPrompt(m.idea, genre, m.style);
    let spec: any;
    try {
      const providerResult = await this.callProvider(m.provider, m.apiKey, prompt);
      spec = this.parseSpecFromProvider(providerResult, m);
    } catch (err) {
      spec = this.fallbackSpec(m, genre);
    }
    await this.env.OPG_DB.prepare(
      'INSERT INTO game_specs (id, game_id, version, spec_json, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), m.gameId, 1, JSON.stringify(spec), Date.now()).run();
    return { spec };
  }

  private async callProvider(provider: string, apiKey: string, prompt: string): Promise<string> {
    const base = provider === 'nvidia'
      ? 'https://integrate.api.nvidia.com/v1/chat/completions'
      : provider === 'kilo'
        ? 'https://api.kilo.ai/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: provider === 'nvidia' ? 'meta/llama-3.1-8b-instruct' : 'openai/gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 800 }),
    });
    if (!res.ok) throw new Error(`provider ${provider} failed: ${res.status}`);
    const data = (await res.json()) as any;
    return data?.choices?.[0]?.message?.content ?? '';
  }

  private buildSpecPrompt(idea: string, genre: string, style: string): string {
    return `You are an indie game designer. Produce a compact JSON GameSpec.\nIdea: ${idea}\nGenre: ${genre}\nStyle: ${style}\nJSON only with keys: id, title, genre, style, coreLoop, goal, difficulty, mechanics, victoryCondition, defeatCondition, assetRequirements, animations, level.`;
  }

  private parseSpecFromProvider(text: string, m: QueueMessage): any {
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) throw new Error('no json');
      const parsed = JSON.parse(text.slice(start, end + 1));
      return { ...this.fallbackSpec(m, m.template), ...parsed };
    } catch {
      return this.fallbackSpec(m, m.template);
    }
  }

  private fallbackSpec(m: QueueMessage, genreHint: string): any {
    const genre = (genreHint === 'auto' ? guessGenre(m.idea) : genreHint) as any;
    return {
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
