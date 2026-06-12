import type { GameSpec } from './GameSpec';
import { validateGameSpec } from './GameSpec';
import { TEMPLATES } from './templates';
import type { TemplateName, TemplateManifest } from './templates';
import type { Env } from '../env';

type BuildManifest = TemplateManifest;

export interface BuildArtifacts {
  gameId: string;
  r2Prefix: string;
  files: { path: string; content: Uint8Array }[];
}

export async function buildGame(spec: GameSpec, env: Env): Promise<BuildArtifacts> {
  const validation = validateGameSpec(spec);
  if (!validation.ok) {
    throw new Error(`invalid spec: ${validation.errors.join(', ')}`);
  }

  const template = spec.genre as TemplateName;
  const manifest = TEMPLATES[template];
  const r2Prefix = `builds/${spec.id}/`;

  // Build a single self-contained index.html that includes the game engine + assets inline as data URIs + level JSON
  const engineJs = await renderEngine(template, manifest);
  const levelJson = JSON.stringify({
    spec,
    level: spec.level,
    player: { spawn: { x: 2, y: 5 } },
    exit: { x: spec.level.width - 3, y: 5 },
    enemies: spec.assetRequirements?.enemies ?? [],
    items: spec.assetRequirements?.items ?? [],
    hazards: [],
  });

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${spec.title} — OPG</title>
<style>
  html,body{margin:0;background:#111;color:#eee;font-family:monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;overflow:hidden}
  #wrap{image-rendering:pixelated;image-rendering:crisp-edges;border:2px solid #333;background:#000}
  #hud{font-size:12px;margin-top:8px;color:#aaa}
  #hud b{color:#fff}
</style>
</head>
<body>
<div id="wrap"><canvas id="c" width="${spec.level.width * spec.level.tileSize}" height="${spec.level.height * spec.level.tileSize}"></canvas></div>
<div id="hud"><b>${spec.title}</b> — ${template} — ${spec.style}</div>
<script>
${engineJs}
const LEVEL = ${levelJson};
window.addEventListener('load', () => initGame(LEVEL));
</script>
</body>
</html>`;

  const htmlBytes = new TextEncoder().encode(html);

  return {
    gameId: spec.id,
    r2Prefix,
    files: [
      { path: `${r2Prefix}index.html`, content: htmlBytes },
      { path: `${r2Prefix}manifest.json`, content: new TextEncoder().encode(JSON.stringify({ spec, template, createdAt: Date.now() })) },
    ],
  };
}

async function renderEngine(template: TemplateName, manifest: typeof TEMPLATES[TemplateName]): Promise<string> {
  // Tiny runtime engine: all templates share the same engine, template config selects controls.
  // Keep it under ~3KB. No external deps.
  return `
(function(){
'use strict';
const cvs=document.getElementById('c'),ctx=cvs.getContext('2d');
const W=cvs.width, H=cvs.height;
const TS=${template === 'platformer' || template === 'collectathon' ? '16' : '16'};
const COLS=Math.floor(W/TS), ROWS=Math.floor(H/TS);
const keys=Object.create(null);
window.addEventListener('keydown',e=>keys[e.code]=true);
window.addEventListener('keyup',e=>keys[e.code]=false);

let state={};
function loadLevel(L){
  state={...L, t:0, cam:{x:0,y:0}, over:false};
  if(!state.player) state.player={x:state.player?.spawn?.x??2,y:state.player?.spawn?.y??5,w:1,h:1,vx:0,vy:0,onGround:false};
  if(!state.exit) state.exit={x:COLS-3,y:ROWS-5};
  if(!state.enemies) state.enemies=[];
  if(!state.items) state.items=[];
}
function rect(x,y,w,h){ctx.fillRect(x*TS,y*TS,w*TS,h*TS);}
function step(){
  state.t++;
  const p=state.player;
  if(keys['ArrowLeft']||keys['KeyA'])p.x-=0.1;
  if(keys['ArrowRight']||keys['KeyD'])p.x+=0.1;
  if((keys['ArrowUp']||keys['KeyW']||keys['Space'])&&p.onGround){p.vy=-3;p.onGround=false;}
  p.vy+=0.15;p.y+=p.vy;
  if(p.y>=state.exit?.y??ROWS-5){p.onGround=true;p.vy=0;p.y=(state.exit?.y??ROWS-5);}
  // win
  if(p.x>=state.exit.x-1&&p.y===state.exit.y){state.over='win';}
  // simple enemy contact
  for(const e of state.enemies){
    if(Math.hypot((p.x+0.5)-e.x,(p.y+0.5)-e.y)<0.8)state.over='lose';
  }
  // camera
  state.cam.x=Math.max(0,Math.min(p.x-5,W/TS));
}
function draw(){
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  // draw entities
  for(const e of state.enemies||[]){ctx.fillStyle='#e94560';rect(e.x,e.y,1,1);}
  for(const it of state.items||[]){ctx.fillStyle='#ffd166';rect(it.x,it.y,1,1);}
  // player
  ctx.fillStyle='#3a9f4a';rect(state.player.x,state.player.y,state.player.w,state.player.h);
  // exit
  ctx.fillStyle='#4ecdc4';rect(state.exit.x,state.exit.y,1,1);
  // HUD
  ctx.fillStyle='#fff';ctx.font='10px monospace';ctx.fillText('OPG',10,14);
  if(state.over){ctx.fillStyle=state.over==='win'?'#0f0':'#f00';ctx.fillText(state.over==='win'?'YOU WIN':'GAME OVER',W/2-40,H/2);}
}
function loop(){requestAnimationFrame(loop);step();draw();}
window.initGame=function(L){loadLevel(L||LEVEL);loop();};
})();
`;
}