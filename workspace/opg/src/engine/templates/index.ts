export const TEMPLATE_NAMES = ['platformer', 'topdown', 'shooter', 'rpg-lite', 'collectathon', 'boss_arena'] as const;
export type TemplateName = (typeof TEMPLATE_NAMES)[number];

export interface TemplateManifest {
  name: TemplateName;
  features: string[];
  mechanics: string[];
  requiredAssets: string[];
  engineApi: string[]; // function names expected in game.js
}

export const TEMPLATES: Record<TemplateName, TemplateManifest> = {
  platformer: {
    name: 'platformer',
    features: ['run', 'jump', 'gravity', 'collision', 'movingPlatforms', 'enemies', 'boss', 'items', 'checkpoints', 'hud'],
    mechanics: ['jump', 'run', 'attack'],
    requiredAssets: ['player_idle', 'player_walk', 'player_jump', 'player_attack', 'enemy_idle', 'tileset', 'background', 'ui_icons'],
    engineApi: ['init', 'update', 'render', 'collide', 'spawnEnemy', 'spawnItem', 'endLevel'],
  },
  topdown: {
    name: 'topdown',
    features: ['4dir-move', 'collision', 'items', 'enemies', 'npcs', 'doors', 'keys', 'dialogue', 'health', 'rooms'],
    mechanics: ['move', 'interact', 'attack'],
    requiredAssets: ['player_down', 'player_up', 'tileset', 'npc_1', 'key', 'door', 'ui_icons'],
    engineApi: ['init', 'update', 'render', 'move', 'interact', 'transitionRoom'],
  },
  shooter: {
    name: 'shooter',
    features: ['move', 'shoot', 'enemyWaves', 'powerups', 'bossWave', 'score', 'health', 'victory', 'gameover'],
    mechanics: ['move', 'shoot', 'dodge'],
    requiredAssets: ['player_ship', 'bullet', 'enemy_1', 'powerup', 'boss', 'background', 'ui_icons'],
    engineApi: ['init', 'update', 'render', 'shoot', 'spawnWave', 'endBoss'],
  },
  'rpg-lite': {
    name: 'rpg-lite',
    features: ['player', 'npc', 'dialog', 'questItem', 'enemy', 'combat', 'inventory', 'roomTransitions'],
    mechanics: ['move', 'interact', 'attack', 'inventory'],
    requiredAssets: ['player_down', 'npc_1', 'enemy_1', 'chest', 'sword', 'tileset', 'ui_icons'],
    engineApi: ['init', 'update', 'render', 'interact', 'openInventory', 'transitionRoom'],
  },
  collectathon: {
    name: 'collectathon',
    features: ['move', 'jump', 'collectibles', 'score', 'timer', 'hazards', 'victory', 'gameover'],
    mechanics: ['move', 'jump', 'collect'],
    requiredAssets: ['player_idle', 'player_jump', 'coin', 'gem', 'hazard', 'tileset', 'ui_icons'],
    engineApi: ['init', 'update', 'render', 'collect', 'endLevel'],
  },
  'boss_arena': {
    name: 'boss_arena',
    features: ['move', 'attack', 'dodge', 'boss', 'phases', 'health', 'victory', 'gameover'],
    mechanics: ['move', 'attack', 'dodge'],
    requiredAssets: ['player_idle', 'player_attack', 'boss_idle', 'boss_attack', 'projectile', 'tileset', 'ui_icons'],
    engineApi: ['init', 'update', 'render', 'attack', 'dodge', 'nextPhase'],
  },
};
