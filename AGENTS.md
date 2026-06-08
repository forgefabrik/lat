# AGENTS.md

## Project Structure & Module Organization

This repository is a Rust workspace structured as a vertical simulation system.

Top‑level directories:

- `crates/` → Core Rust modules (simulation engine, protocol, server, economy, life, dungeon, etc.)
- `docs/` → Architecture notes and subsystem descriptions
- `assets/` → Sprite and simulation asset definitions
- `scripts/` → Helper scripts for asset generation and validation
- `tests/` → Integration and system‑level tests

Each crate in `crates/lat-*` represents an isolated subsystem. Communication between crates happens strictly through `lat-protocol`.

---

## Build, Test, and Development Commands

Standard Rust tooling is used.

**Build project:**
```bash
cargo build --workspace
```
- Compiles all crates in the workspace.

**Run tests:**
```bash
cargo test --workspace
```
- Executes unit and integration tests for every crate.

**Run a specific crate:**
```bash
cargo run -p lat-server -- --port 3000
```
- Starts the server (or any crate) with an explicit port.

**Optional scripts:**
```bash
./scripts/run_local.sh
./scripts/generate_assets.sh
./scripts/validate_assets.sh
```

*No default runtime port exists. A port must always be provided via CLI or environment variable.*

### Coding Style & Naming Conventions
- Rust formatting enforced via `rustfmt`
- Linting via `clippy`
- Crates use kebab‑case naming (`lat-engine`, `lat-protocol`)
- Modules use `snake_case`
- Structs and enums use PascalCase
- All inter‑module communication must go through `lat-protocol`

Avoid duplicate logic across crates. Each subsystem owns a single responsibility.

---

## Testing Guidelines

Tests are located in `/tests` and within crate‑level `tests/` folders.

**Run all tests:**
```bash
cargo test --workspace
```

Testing requirements:
- Unit tests for core logic in each crate
- Integration tests for engine tick loop and event streaming
- Simulation determinism should be preserved where possible
- Focus on event correctness rather than internal state inspection

---

## Commit & Pull Request Guidelines

Use conventional commits:
- `feat:` new features
- `fix:` bug fixes
- `refactor:` internal restructuring
- `test:` test changes

PRs must include:
- Clear description of changes
- Linked issue (if applicable)
- Passing CI checks
- Notes on simulation impact if engine logic changes

---

## Security & Architecture Notes
- No database is used; all state is in‑memory
- Configuration is environment‑based
- No default ports; explicit binding required

---

## High‑Level Architecture (from `docs/ckaude_v0.1:promt.md`)

```
🧠 LAT CORE SET (FINAL)
🧱 WORKSPACE ROOT
/home/bkg/repo/tower/lat/v0.1_claude/
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

**SYSTEM RULES**
- Event‑driven simulation
- In‑memory state only
- Tick‑based execution
- Vertical tower world
- No default port anywhere

**CORE CRATES**
- `lat-protocol` → types + events (single truth)
- `lat-engine`   → tick loop + orchestration
- `lat-server`   → API + SSE stream
- `lat-dungeon`  → entry jobs + early economy
- `lat-education`→ skill + research
- `lat-society`  → relationships graph
- `lat-economy`  → money system
- `lat-life`     → lifecycle transitions
- `lat-memory`   → knowledge system
- `lat-needs`    → agent state pressures
- `lat-facilities`→ building effects
- `lat-world`    → tower floors + layout
- `lat-office`   → optional UI state
- `lat-ceo`      → decision controller

**TICK PIPELINE** (executed each tick in order)
```
Dungeon → Education → Society → Office → Needs → Economy → Life → Memory → CEO → Emit Events
```

**EVENT BUS** (published/subscribed by subsystems)
- `AgentSpawned`
- `JobCompleted`
- `XpGained`
- `MoneyChanged`
- `RelationshipUpdated`
- `LifeStageChanged`
- `FacilityUsed`
- `CeoDecision`
- `Tick`

**AGENT CORE MODEL**
```rust
struct Agent {
    id: ..., stage: ..., shift: ..., xp: ..., wallet: ..., needs: ..., relationships: ...
}
```

**SUBSYSTEM SNAPSHOTS**
- *Dungeon*: entry zone, jobs (scan, carry, clean, deliver) → yields XP, money, memory shard.
- *Education*: school → XP, university → research → memory shards.
- *Life*: XP thresholds → stage upgrades, retirement → legacy.
- *Economy*: salary drain, dungeon income, facility costs, treasury balance.
- *Memory*: skill, experience, social shards; decay over time.
- *Facilities*: gym (stress down), bar (social up), school (XP up), office (money), dungeon (jobs).
- *World*: vertical tower floors (dungeon, market, housing, social, office, education, university, CEO layers).
- *CEO*: consumes world state, emits decisions (spawn agents, open floors, adjust economy, modify difficulty).
- *Server*: HTTP endpoints `GET /health`, `GET /state`, `GET /events` (SSE). Must set `PORT` env var.

**TESTS** focus on:
- Engine tick correctness
- Event flow integrity
- Economy balance
- Lifecycle transitions

**FINAL STATE**
```
LAT = living simulation tower
Agents evolve through layered society
Everything is event‑driven, streamed, and in‑memory only.
```

---

### Core architecture modules (reiterated)
- `lat-engine`
- `lat-protocol`
- `lat-server`
- `lat-economy`
- `lat-life`
- `lat-dungeon`
- `lat-education`
- `lat-society`
- `lat-needs`
- `lat-memory`
- `lat-facilities`
- `lat-world`
- `lat-office`
- `lat-ceo`

All simulation logic flows through a single tick‑based engine loop.

---

*Generated and curated for Claude Code guidance.*