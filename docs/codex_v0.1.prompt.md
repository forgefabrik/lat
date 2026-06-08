🧠 LAT CORE SET (FINAL)
🧱 WORKSPACE ROOT
/home/bkg/repo/tower/lat/v0.1_codex/
│
├── crates/
│   ├── lat-protocol
│   ├── lat-engine
│   ├── lat-server
│   ├── lat-world
│   ├── lat-dungeon
│   ├── lat-education
│   ├── lat-office
│   ├── lat-social
│   ├── lat-economy
│   ├── lat-life
│   ├── lat-memory
│   ├── lat-ceo
│   ├── lat-assets
│
├── assets/
├── scripts/
├── docs/
└── Dockerfile
```
⚙️ SYSTEM RULES
- event-driven simulation
- in-memory state only
- tick-based execution
- vertical tower world
- no default port anywhere
🧬 CORE CRATES
lat-protocol     → types + events (single truth)
lat-engine       → tick loop + orchestration
lat-server       → API + SSE stream
lat-dungeon      → entry jobs + early economy
lat-education    → skill + research
lat-society      → relationships graph
lat-economy      → money system
lat-life         → lifecycle transitions
lat-memory       → knowledge system
lat-needs        → agent state pressures
lat-facilities   → building effects
lat-world        → tower floors + layout
lat-office       → optional UI state
lat-ceo          → decision controller
🔁 TICK PIPELINE
dungeon
education
society
office
needs
economy
life
memory
ceo
emit events
📡 EVENT BUS
AgentSpawned
JobCompleted
XpGained
MoneyChanged
RelationshipUpdated
LifeStageChanged
FacilityUsed
CeoDecision
Tick
🧍 AGENT CORE MODEL
Agent {
  id
  stage
  shift
  xp
  wallet
  needs
  relationships
}
🕳 DUNGEON LOGIC
entry zone for all new agents

jobs:
- scan
- carry
- clean
- deliver

output:
xp + money + memory shard
🏫 EDUCATION LOGIC
school → xp gain
university → research → memory shards
🧓 LIFE LOGIC
xp threshold → stage upgrade
retirement → legacy node
💰 ECONOMY LOGIC
salary drain
dungeon income
facility costs
treasury balance
🧠 MEMORY LOGIC
skill shards
experience shards
social shards
transferable knowledge
decay over time
🏢 FACILITY SYSTEM
gym → stress down
bar → social up
school → xp up
office → money generation
dungeon → entry jobs
🌍 WORLD STRUCTURE
vertical tower floors

- dungeon layer
- market layer
- housing layer
- social layer
- office layer
- education layer
- university layer
- ceo layer
🤖 CEO SYSTEM
input: world state
output: decision events

actions:
- spawn agents
- open floors
- adjust economy
- modify difficulty
🌐 SERVER
endpoints:
GET /health
GET /state
GET /events (SSE)

rule:
server requires explicit port only

🧪 TESTS
engine tick correctness
event flow integrity
economy balance
life cycle transitions
🧩 FINAL STATE

LAT =

living simulation tower
agents evolve through layered society
everything is event-driven
everything is streamed
no persistence