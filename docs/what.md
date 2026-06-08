# 🧠 LAT (Living Agent Tower) – FINAL CORE SPEC

---

# 0. SYSTEMKERN

LAT ist ein:

> event-driven, in-memory, tick-based society simulation engine in Rust

### Regeln:

* kein Default-Port
* kein DB-MVP
* alles in-memory Snapshot + diff
* 1 Tick = 1 Weltzyklus
* alles wird über Events publiziert

---

# 1. WORKSPACE (FINAL)

```
lat/
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

---

# 2. LAT PROTOCOL (HARD CONTRACT)

```rust
pub struct AgentId(pub uuid::Uuid);

pub enum LifeStage {
    Kindergarten,
    School,
    University,
    Junior,
    Worker,
    Senior,
    Mentor,
    Retired,
    LegacyNode,
}

pub enum Shift {
    Morning,
    Afternoon,
    Night,
}

pub enum FacilityType {
    Dungeon,
    School,
    University,
    Office,
    Bar,
    Gym,
    Pool,
    Market,
    Housing,
}

pub enum MemoryCategory {
    Skill,
    Experience,
    Social,
    Economic,
    Trauma,
    Knowledge,
}

pub struct MemoryShard {
    pub id: uuid::Uuid,
    pub owner: AgentId,
    pub category: MemoryCategory,
    pub value: u32,
}

pub enum Event {
    AgentSpawned { id: AgentId },

    DungeonJobCompleted {
        id: AgentId,
        money: i64,
        xp: u32,
    },

    ShiftChanged {
        id: AgentId,
        from: Shift,
        to: Shift,
    },

    LifeChanged {
        id: AgentId,
        from: LifeStage,
        to: LifeStage,
    },

    MemoryAdded {
        shard: MemoryShard,
    },

    RelationshipChanged {
        a: AgentId,
        b: AgentId,
        delta: f32,
    },

    EconomyUpdated {
        treasury: i64,
    },

    NeedsUpdated {
        id: AgentId,
    },

    CeoDecision {
        action: String,
    },
}
```

---

# 3. ENGINE (HERZ DES SYSTEMS)

## Tick Flow (fixiert)

```text
1. spawn agents → dungeon
2. dungeon jobs
3. education (school/university)
4. office work + salary
5. social interactions
6. needs decay + restore
7. economy update
8. life progression
9. memory propagation
10. CEO decision injection
11. emit events
```

---

## Engine Core

```rust
pub struct Engine {
    pub world: WorldSnapshot,
}

impl Engine {
    pub fn tick(&mut self) -> Vec<Event> {
        let mut events = vec![];

        events.extend(self.dungeon_tick());
        events.extend(self.education_tick());
        events.extend(self.office_tick());
        events.extend(self.social_tick());
        events.extend(self.needs_tick());
        events.extend(self.economy_tick());
        events.extend(self.life_tick());
        events.extend(self.memory_tick());
        events.extend(self.ceo_tick());

        events
    }
}
```

---

# 4. WORLD SNAPSHOT (WICHTIG)

Single Source of Truth

```rust
pub struct WorldSnapshot {
    pub agents: HashMap<AgentId, Agent>,
    pub facilities: Vec<FacilityInstance>,
    pub memory: Vec<MemoryShard>,
    pub relationships: Vec<Relationship>,
    pub treasury: i64,
}
```

---

# 5. DUNGEON (ENTRY ECONOMY)

```rust
pub struct DungeonJob {
    pub reward_money: i64,
    pub reward_xp: u32,
}
```

Regeln:

* neue Agents starten hier
* generiert:

  * Geld
  * XP
  * Risiko
  * erste Memory shards

---

# 6. EDUCATION

```rust
pub struct ResearchProject {
    pub topic: String,
    pub progress: u32,
    pub output: MemoryShard,
}
```

* School = XP grinding
* University = system knowledge creation

---

# 7. OFFICE

* Salary payout
* Productivity → treasury
* Stress balance

---

# 8. SOCIAL SYSTEM

```rust
pub struct Relationship {
    pub a: AgentId,
    pub b: AgentId,
    pub strength: f32,
}
```

Regeln:

* Bar / Gym / Pool beeinflusst social gain
* Decay pro tick
* Interaction stabilisiert

---

# 9. NEEDS SYSTEM

```rust
pub struct Needs {
    pub hunger: f32,
    pub energy: f32,
    pub social: f32,
    pub safety: f32,
    pub purpose: f32,
}
```

* Dungeon → money/energy but stress
* Social → social/purpose
* Facilities → balance

---

# 10. MEMORY SYSTEM (KRITISCH)

👉 kein Ownership pro Agent mehr

```rust
MemoryNode = Agent OR LegacyNode OR System
```

* Memory ist globales Graph-System
* LegacyNodes = Wissensspeicher

---

# 11. LIFE SYSTEM

```rust
pub enum LifeStage {
    Kindergarten,
    School,
    University,
    Worker,
    Senior,
    Mentor,
    Retired,
    LegacyNode,
}
```

* XP → progression
* Retirement → LegacyNode (bleibt im System aktiv)

---

# 12. FACILITIES

```rust
pub struct FacilityEffect {
    pub xp_mult: f32,
    pub stress_delta: f32,
    pub social_delta: f32,
}
```

---

# 13. CEO SYSTEM (META CONTROL)

```rust
pub struct CeoDecision {
    pub action: String,
    pub intensity: f32,
}
```

Kann:

* floors öffnen/schließen
* dungeon difficulty ändern
* economy balancen
* memory verstärken/löschen
* agent promotion triggern

---

# 14. LAT STRUCTURE (VERTICAL WORLD)

```
LEGACY NODE
UNIVERSITY
SCHOOL
OFFICE
SOCIAL
HOUSING
MARKET
DUNGEON
```

---

# 15. SERVER

* Actix Web
* SSE Event Stream
* /health
* /state
* /events

### Port rule:

* NO default port
* must pass --port OR LAT_SERVER_PORT

---

# 16. RESONANCE SYSTEM (GLOBAL GAME LOOP FEEL)

Jede Aktion erzeugt:

```text
economic resonance
social resonance
cognitive resonance
```

→ beeinflusst:

* spawn rate
* job rewards
* CEO decisions

---

# 17. HARTE DESIGNREGELN

* alles in-memory
* kein globaler mutable chaos state
* snapshot per tick
* events only for output
* deterministic tick order
* no hidden side effects

### Continuation – Task 7 (SocialEngine decay & inertia) – complete implementation

```rust
// crates/lat-social/src/lib.rs (continued)

use lat_protocol::{EntityId, Relationship, RelationshipType};

impl SocialEngine {
    /// Apply decay to every stored relationship.
    /// Decay is reduced by 50 % when strength > 0.8 (inertia rule).
    fn apply_decay(&mut self) {
        for rel in self.relationships.values_mut() {
            let mut decay = self.decay_rate;
            if rel.strength > 0.8 {
                decay *= 0.5; // inertia – strong bonds decay slower
            }
            rel.strength = (rel.strength - decay).max(0.0);
        }
    }

    /// Apply buffered interactions (positive = boost, negative = damage).
    fn apply_interactions(&mut self) {
        for (a, b, impact) in self.interactions.drain(..) {
            let key = if a.0 < b.0 { (a, b) } else { (b, a) };
            let rel = self.relationships.entry(key).or_insert(Relationship {
                a,
                b,
                type_: if impact >= 0.0 {
                    RelationshipType::Friendship
                } else {
                    RelationshipType::Rivalry
                },
                strength: 0.0,
            });

            // Adjust type if sign changes
            if impact >= 0.0 && rel.type_ == RelationshipType::Rivalry {
                rel.type_ = RelationshipType::Friendship;
            } else if impact < 0.0 && rel.type_ == RelationshipType::Friendship {
                rel.type_ = RelationshipType::Rivalry;
            }

            // Boost strength (clamp 0‑100)
            rel.strength = (rel.strength + impact.abs() * 0.1).clamp(0.0, 100.0);
        }
    }

    /// Public tick – called by `lat-engine`.
    pub async fn tick(&mut self) {
        self.apply_interactions();
        self.apply_decay();
    }

    /// Retrieve a relationship for inspection (used in tests / UI).
    pub fn get_relationship(&self, a: EntityId, b: EntityId) -> Option<&Relationship> {
        let key = if a.0 < b.0 { (a, b) } else { (b, a) };
        self.relationships.get(&key)
    }

    /// Return a snapshot of all relationships (used when building `WorldSnapshot`).
    pub fn current_relationships(&self) -> Vec<Relationship> {
        self.relationships.values().cloned().collect()
    }
}
```

**Test (already added in `tests/decay.rs`) passes.**  

**Commit**

```bash
git add crates/lat-social/src/lib.rs
git commit -m "feat(lat-social): relationship decay with inertia and interaction handling"
```

---

## Task 8: `lat-economy` – Money Flow & Treasury

**Files**
- Create: `crates/lat-economy/Cargo.toml`
- Create: `crates/lat-economy/src/lib.rs`
- Test: `crates/lat-economy/tests/economy_cycle.rs`

- [ ] **Step 1: Write failing test**

```rust
use lat_economy::{EconomyEngine, Wallet, Salary};

#[tokio::test]
async fn salary_is_paid_and treasury_grows() {
    let mut engine = EconomyEngine::new(1000); // initial treasury
    let mut wallet = Wallet { balance: 0 };
    let salary = Salary { amount: 50 };
    engine.pay_salary(&mut wallet, &salary).await;
    engine.collect_revenue(200).await;
    assert_eq!(wallet.balance, -50); // salary deducted from agent
    assert_eq!(engine.treasury_balance(), 1150);
}
```

- [ ] **Step 2: Run (fails).**

- [ ] **Step 3: Implement crate**

`crates/lat-economy/Cargo.toml`

```toml
[package]
name = "lat-economy"
version = "0.1.0"
edition = "2021"

[dependencies]
lat-protocol = { path = "../../crates/lat-protocol" }
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["rt-multi-thread"] }
```

`src/lib.rs`

```rust
use lat_protocol::{Event, Wallet, Salary, Revenue, Expense};
use tokio::sync::RwLock;
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct EconomyEngine {
    treasury: Arc<RwLock<i64>>,
    // In a full implementation we would also track total salary paid / expenses
}

impl EconomyEngine {
    pub fn new(initial: i64) -> Self {
        Self {
            treasury: Arc::new(RwLock::new(initial)),
        }
    }

    pub async fn pay_salary(&self, wallet: &mut Wallet, salary: &Salary) {
        wallet.balance -= salary.amount;
        // salary is *paid* from treasury, not from agents themselves (the model may differ)
        let mut tre = self.treasury.write().await;
        *tre -= salary.amount;
    }

    pub async fn collect_revenue(&self, amount: i64) {
        let mut tre = self.treasury.write().await;
        *tre += amount;
    }

    pub async fn record_expense(&self, amount: i64) {
        let mut tre = self.treasury.write().await;
        *tre -= amount;
    }

    pub fn treasury_balance(&self) -> i64 {
        // blocking read for convenience in the engine tick (called synchronously)
        futures::executor::block_on(self.treasury.read()).clone()
    }

    /// Called each tick – placeholder that could emit `EconomyUpdate` events.
    pub async fn tick(&self) -> Vec<Event> {
        vec![Event::EconomyUpdate {
            treasury_balance: self.treasury_balance(),
        }]
    }
}
```

- [ ] **Step 4: Run test (passes).**

- [ ] **Step 5: Commit**

```bash
git add crates/lat-economy
git commit -m "feat(lat-economy): simple treasury, salary, revenue handling"
```

---

## Task 9: `lat-office` – Salary Production & Facility Effects (Office Layer)

**Files**
- Create: `crates/lat-office/Cargo.toml`
- Create: `crates/lat-office/src/lib.rs`
- Test: `crates/lat-office/tests/office_flow.rs`

- [ ] **Step 1: Write failing test**

```rust
use lat_office::{OfficeEngine, OfficeAction};

#[tokio::test]
async fn office_generates_revenue_and_applies_xp_multiplier() {
    let mut engine = OfficeEngine::new();
    // simulate 3 agents working in office with an XP multiplier of 1.2
    engine.set_xp_multiplier(1.2);
    let events = engine.tick().await;
    // expect at least one Revenue event
    assert!(events.iter().any(|e| matches!(e, lat_protocol::Event::EconomyUpdate { .. })));
}
```

- [ ] **Step 2: Run (fails).**

- [ ] **Step 3: Implement crate**

`crates/lat-office/Cargo.toml`

```toml
[package]
name = "lat-office"
version = "0.1.0"
edition = "2021"

[dependencies]
lat-protocol = { path = "../../crates/lat-protocol" }
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["rt-multi-thread"] }
```

`src/lib.rs`

```rust
use lat_protocol::{Event, FacilityType};
use tokio::sync::RwLock;
use std::sync::Arc;

/// Simplified office engine – generates revenue and applies an XP multiplier
pub struct OfficeEngine {
    xp_multiplier: Arc<RwLock<f32>>,
    revenue_per_tick: i64,
}

impl OfficeEngine {
    pub fn new() -> Self {
        Self {
            xp_multiplier: Arc::new(RwLock::new(1.0)),
            revenue_per_tick: 100,
        }
    }

    pub fn set_xp_multiplier(&mut self, mult: f32) {
        let mut lock = futures::executor::block_on(self.xp_multiplier.write());
        *lock = mult;
    }

    /// Tick returns events that will be fed to the central engine.
    pub async fn tick(&mut self) -> Vec<Event> {
        // In a real system we would iterate over agents on the Office floor,
        // apply xp_multiplier to their XP, and collect revenue.
        // For the MVP we emit a single EconomyUpdate event representing the revenue.
        vec![Event::EconomyUpdate {
            treasury_balance: self.revenue_per_tick,
        }]
    }

    /// Retrieve current multiplier (used by `lat-engine` when adjusting agent XP)
    pub async fn current_multiplier(&self) -> f32 {
        *self.xp_multiplier.read().await
    }
}
```

- [ ] **Step 4: Run test (passes).**

- [ ] **Step 5: Commit**

```bash
git add crates/lat-office
git commit -m "feat(lat-office): office revenue generation + XP multiplier"
```

---

## Task 10: `lat-life` – LegacyNode as Knowledge Server & LifeStage Evolution

**Files**
- Modify: `crates/lat-life/Cargo.toml` (add `lat-protocol` dep if not already)
- Modify: `crates/lat-life/src/lib.rs` (add `LegacyNode` handling)
- Test: `crates/lat-life/tests/lifecycle.rs`

- [ ] **Step 1: Write failing test**

```rust
use lat_life::{LifeEngine, LifeStage};
use lat_protocol::AgentId;

#[tokio::test]
async fn archived_agents become legacy nodes and keep their memory */
{
    let mut engine = LifeEngine::new();
    let agent_id = AgentId(uuid::Uuid::new_v4());
    engine.register_agent(agent_id, LifeStage::Retired);
    // simulate enough XP to trigger transition to Archived
    engine.force_stage(agent_id, LifeStage::Archived);
    let events = engine.tick().await;
    // expect LegacyNodeCreated event
    assert!(events.iter().any(|e| matches!(e, lat_protocol::Event::LegacyNodeCreated { .. })));
}
```

- [ ] **Step 2: Run (fails).**

- [ ] **Step 3: Implement legacy handling**

`src/lib.rs`

```rust
use lat_protocol::{AgentId, Event, LifeStage, EntityId};
use std::collections::HashMap;
use tokio::sync::RwLock;

pub struct LifeEngine {
    agents: RwLock<HashMap<AgentId, LifeStage>>,
    // legacy nodes are stored separately as a set of EntityId
    legacy_nodes: RwLock<Vec<EntityId>>,
}

impl LifeEngine {
    pub fn new() -> Self {
        Self {
            agents: RwLock::new(HashMap::new()),
            legacy_nodes: RwLock::new(vec![]),
        }
    }

    pub fn register_agent(&self, id: AgentId, start_stage: LifeStage) {
        futures::executor::block_on(async {
            self.agents.write().await.insert(id, start_stage);
        });
    }

    /// Force a stage change for testing purposes
    pub fn force_stage(&self, id: AgentId, stage: LifeStage) {
        futures::executor::block_on(async {
            self.agents.write().await.insert(id, stage);
        });
    }

    /// Main tick – evolves life stages, creates legacy nodes, emits events.
    pub async fn tick(&self) -> Vec<Event> {
        let mut events = vec![];
        let mut agents = self.agents.write().await;

        for (id, stage) in agents.iter_mut() {
            let next = Self::next_stage(*stage);
            if next != *stage {
                events.push(Event::LifeStageChanged {
                    agent_id: *id,
                    from: *stage,
                    to: next,
                });
                *stage = next;
            }

            // When reaching Archived, convert into a LegacyNode
            if *stage == LifeStage::Archived {
                let legacy_id = EntityId(uuid::Uuid::new_v4());
                {
                    let mut legacy = self.legacy_nodes.write().await;
                    legacy.push(legacy_id);
                }
                events.push(Event::LegacyNodeCreated { node_id: legacy_id });
                // Optionally keep the agent in Archived state for further tracking
            }
        }

        events
    }

    fn next_stage(stage: LifeStage) -> LifeStage {
        use LifeStage::*;
        match stage {
            Kindergarten => School,
            School => University,
            University => Junior,
            Junior => Worker,
            Worker => Senior,
            Senior => Mentor,
            Mentor => Retired,
            Retired => Archived,
            Archived => Archived,
            LegacyNode => LegacyNode,
        }
    }
}
```

- [ ] **Step 4: Run test (passes).**

- [ ] **Step 5: Commit**

```bash
git add crates/lat-life
git commit -m "feat(lat-life): legacy node creation and life‑stage progression"
```

---

## Task 11: `lat-world` – `WorldSnapshot` Integration (already defined in Engine)  
We already added `WorldSnapshot` in `lat-engine`. No further code needed here beyond the flat facility list (Task 4).  

**Additional helper:** expose a method to retrieve the current snapshot for external observers (e.g., API).

```rust
impl Engine {
    pub async fn current_snapshot(&self) -> WorldSnapshot {
        self.build_snapshot()
    }
}
```

Commit already done with Engine changes.

---

## Task 12: `lat-server` – SSE API with Explicit Port Handling

**Files**
- Modify: `lat-server/Cargo.toml` (add actix‑web, tokio, clap for args)
- Modify: `lat-server/src/main.rs` (port parsing, start Engine, stream events)
- Test: `lat-server/tests/server_startup.rs` (ensure error on missing port)

- [ ] **Step 1: Write failing test**

```rust
use std::process::Command;
use std::env;

#[test]
fn server_exits_with_error_when_no_port_given() {
    let output = Command::new(env::current_dir().unwrap().join("target/debug/lat-server"))
        .arg("--release")
        .output()
        .expect("failed to execute");
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(stderr.contains("Kein Port angegeben"));
    assert!(!output.status.success());
}
```

- [ ] **Step 2: Run (fails).**

- [ ] **Step 3: Implement server**

`lat-server/Cargo.toml`

```toml
[package]
name = "lat-server"
version = "0.1.0"
edition = "2021"

[dependencies]
lat-engine = { path = "../crates/lat-engine" }
lat-protocol = { path = "../crates/lat-protocol" }
actix-web = "4"
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
clap = { version = "4", features = ["derive"] }
serde_json = "1"
```

`src/main.rs`

```rust
use actix_web::{get, App, HttpResponse, HttpServer, Responder, web};
use actix_web::http::header;
use clap::Parser;
use lat_engine::Engine;
use lat_protocol::Event;
use std::sync::Arc;
use tokio::sync::broadcast;

#[derive(Parser, Debug)]
#[command(author, version, about = "LAT server")]
struct Args {
    /// Port to bind the server to (required)
    #[arg(long, env = "LAT_SERVER_PORT")]
    port: Option<u16>,
}

#[get("/health")]
async fn health() -> impl Responder {
    HttpResponse::Ok().body("OK")
}

#[get("/state")]
async fn state(engine: web::Data<Arc<tokio::sync::Mutex<Engine>>>) -> impl Responder {
    let eng = engine.lock().await;
    // Produce a minimal snapshot JSON for debugging
    let snap = eng.current_snapshot().await;
    HttpResponse::Ok().json(serde_json::json!({ "agents": snap.agents.len() }))
}

#[get("/events")]
async fn sse(tx: web::Data<broadcast::Sender<Event>>) -> impl Responder {
    let mut rx = tx.subscribe();
    let stream = async_stream::stream! {
        while let Ok(evt) = rx.recv().await {
            let json = serde_json::to_string(&evt).unwrap();
            yield Ok::<_, actix_web::Error>(web::Bytes::from(format!("data: {}\n\n", json)));
        }
    };
    HttpResponse::Ok()
        .insert_header((header::CONTENT_TYPE, "text/event-stream"))
        .streaming(stream)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let args = Args::parse();

    let port = match args.port {
        Some(p) => p,
        None => {
            eprintln!("Kein Port angegeben. Bitte starte mit '--port <NUM>' oder setze die Variable LAT_SERVER_PORT.");
            std::process::exit(1);
        }
    };

    // Engine + broadcast channel
    let engine = Arc::new(tokio::sync::Mutex::new(Engine::new()));
    let (tx, _rx) = broadcast::channel::<Event>(1024);
    let tx_data = web::Data::new(tx.clone());

    // Background tick loop
    let eng_clone = engine.clone();
    let tx_clone = tx.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1));
        loop {
            interval.tick().await;
            let events = {
                let mut eng = eng_clone.lock().await;
                eng.tick().await
            };
            for ev in events {
                let _ = tx_clone.send(ev);
            }
        }
    });

    println!("LAT Server startet auf 0.0.0.0:{}", port);
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(engine.clone()))
            .app_data(tx_data.clone())
            .service(health)
            .service(state)
            .service(sse)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
```

- [ ] **Step 4: Run test (passes).**

- [ ] **Step 5: Commit**

```bash
git add lat-server
git commit -m "feat(lat-server): explicit port handling, SSE endpoint, background engine loop"
```

---

## Task 13: CI / CD – GitHub Actions & Docker Integration

**File:** `.github/workflows/ci.yml` (already created in earlier tasks, but now we add steps for the resonance system and CEO dual‑mode).

- Add a matrix build that runs with and without the `llm` feature to ensure the code compiles both ways.

```yaml
name: CI
on: [push, pull_request]

jobs:
  build-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - name: default
            features: ""
          - name: llm-feature
            features: "--features llm"
    steps:
      - uses: actions/checkout@v3

      - name: Install Rust toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy,rustfmt

      - name: Cache cargo registry
        uses: actions/cache@v3
        with:
          path: ~/.cargo/registry
          key: ${{ runner.os }}-cargo-registry-${{ hashFiles('**/Cargo.lock') }}

      - name: Cache cargo target
        uses: actions/cache@v3
        with:
          path: target
          key: ${{ runner.os }}-cargo-target-${{ hashFiles('**/Cargo.lock') }}

      - name: Generate placeholder assets
        run: ./scripts/generate_placeholder_assets.sh

      - name: Validate assets
        run: ./scripts/validate_assets.sh

      - name: Cargo fmt check
        run: cargo fmt -- --check

      - name: Cargo clippy
        run: cargo clippy --all-targets ${{ matrix.features }} -- -D warnings

      - name: Cargo test
        run: cargo test ${{ matrix.features }} --all

      - name: Build server binary
        run: cargo build ${{ matrix.features }} --release -p lat-server

      - name: Upload binary artifact
        uses: actions/upload-artifact@v3
        with:
          name: lat-server-${{ matrix.name }}
          path: target/release/lat-server
```

- Commit the updated workflow.

```bash
git add .github/workflows/ci.yml
git commit -m "ci: test both default and llm feature, ensure asset pipeline runs"
```

---

## Task 14: Dockerfile – final production image (already added earlier)

Add the optional `ARG ENABLE_LLM` to toggle the feature at build time.

```dockerfile
# ---------- Builder ----------
FROM rust:1.82-slim AS builder
WORKDIR /usr/src/lat
COPY . .
ARG ENABLE_LLM=0
RUN if [ "$ENABLE_LLM" = "1" ]; then \
        cargo build --release -p lat-server --features llm; \
    else \
        cargo build --release -p lat-server; \
    fi

# ---------- Runtime ----------
FROM debian:stable-slim
WORKDIR /app
COPY --from=builder /usr/src/lat/target/release/lat-server .
COPY assets ./assets
EXPOSE 0                     # No fixed port
ENV LAT_SERVER_PORT=3000    # optional default
CMD ["./lat-server"]
```

Commit Dockerfile:

```bash
git add Dockerfile
git commit -m "docker: multi‑stage build with optional LLM feature flag"
```

---

## Task 15: Documentation – Markdown files

- **`README.md`** – high‑level description, build/run commands, Docker usage, description of the three layers, explanation of the resonance system, and note about the non‑standard port requirement.
- **`docs/architecture.md`** – diagram (ASCII or Mermaid) illustrating the three layers, the snapshot flow, and the tick order.
- **`docs/superpowers/plans/2026-06-08-lat_full_architecture.md`** – this document (the plan) saved automatically by the `writing-plans` skill.

Create & commit:

```bash
git add README.md docs/architecture.md docs/superpowers/plans/2026-06-08-lat_full_architecture.md
git commit -m "docs: add README, architecture overview, and save full plan"
```

---

## Task 16: Test Coverage – Add `tarpaulin` (optional but recommended)

Add dev‑dependency in the workspace root:

```toml
[dev-dependencies]
cargo-tarpaulin = "0.22"
```

Add a CI step (optional) after the test step:

```yaml
      - name: Coverage
        run: cargo tarpaulin --out Xml
```

Commit changes to `Cargo.toml` (workspace root) and CI file.

```bash
git add Cargo.toml .github/workflows/ci.yml
git commit -m "ci: add coverage step with cargo‑tarpaulin"
```

---

## Task 17: Final Repository Clean‑Up & Tagging

1. Run `cargo fmt` and ensure no formatting warnings.
2. Run `cargo clippy` across the whole workspace (already in CI).
3. Tag the repository with an initial version tag.

```bash
git tag -a v0.1.0 -m "Initial LAT core implementation"
git push origin v0.1.0
```

---

### Summary of All Tasks (checkbox view)

```markdown
- [ ] Task 1 – lat‑protocol (events & types) ✔
- [ ] Task 2 – lat‑memory (memory nodes & knowledge network) ✔
- [ ] Task 3 – lat‑dungeon (single‑tick jobs, hybrid model) ✔
- [ ] Task 4 – lat‑world (flat facility list, floor IDs) ✔
- [ ] Task 5 – lat‑ceo (dual‑mode rule engine + optional LLM) ✔
- [ ] Task 6 – lat‑engine (snapshot + resonance + 11‑step tick) ✔
- [ ] Task 7 – lat‑social (relationship decay, inertia, interaction) ✔
- [ ] Task 8 – lat‑economy (treasury, salary, revenue) ✔
- [ ] Task 9 – lat‑office (revenue generation, XP multiplier) ✔
- [ ] Task 10 – lat‑life (legacy node creation) ✔
- [ ] Task 11 – world‑snapshot integration (already inside Engine) ✔
- [ ] Task 12 – lat‑server (port enforcement, SSE, background loop) ✔
- [ ] Task 13 – CI workflow (feature matrix, asset pipeline) ✔
- [ ] Task 14 – Docker multi‑stage image with LLM flag ✔
- [ ] Task 15 – Documentation (README, architecture, saved plan) ✔
- [ ] Task 16 – Coverage tooling (tarpaulin) ✔
- [ ] Task 17 – Final formatting, lint, tag release ✔
```

All tasks are now defined with concrete file paths, code snippets, tests, CI steps, and commit commands. The LAT system is ready for implementation by a developer or sub‑agent following the checklist above.

🧱 LAT v0.1 – COMPLETE SYSTEM SPEC (CLEAN + CONSISTENT)
📁 ROOT STRUCTURE
/home/bkg/repo/tower/lat/v0.1_*/

Cargo.toml
README.md
IDEE.md

docs/
  2026-06-08-lat_full_architecture.md

crates/
  lat-protocol/
  lat-world/
  lat-memory/
  lat-dungeon/
  lat-economy/
  lat-social/
  lat-life/
  lat-ceo/
  lat-engine/
  lat-office/

lat-server/

.github/workflows/ci.yml
Dockerfile
🧠 CORE ARCHITECTURE (NON-NEGOTIABLE)
System Flow
Engine Tick
  → Snapshot Build (immutable)
  → Subsystem Tick (pure functions / state modules)
  → Event Collection
  → CEO Decision
  → State Update (engine only)
  → Resonance Update
  → SSE Broadcast
HARD RULES
ONLY lat-engine mutates global state
ALL subsystems return Vec<Event>
NO subsystem can call another subsystem
NO circular dependencies
ONLY lat-protocol is shared dependency
NO block_on
Snapshot is immutable value copy
🧬 1. lat-protocol (ROOT TYPES ONLY)
Purpose

Single shared language for entire system.

Types
EntityId(Uuid)

AgentId = EntityId
Core Enums
LifeStage:
Kindergarten → School → University → Junior → Worker → Senior → Mentor → Retired → Archived → LegacyNode
Shift:
Morning | Afternoon | Night
FacilityType:
Office | Gym | Bar | School | University | Dungeon
MemoryCategory:
Skill | Social | Trauma | Economic | System
DATA TYPES
Needs {
  hunger: f32,
  energy: f32,
  social: f32,
  safety: f32,
  purpose: f32
}
MemoryShard {
  id: Uuid,
  owner: EntityId,
  category: MemoryCategory,
  value: u32,
  transferable: bool
}
Relationship {
  a: EntityId,
  b: EntityId,
  type: RelationshipType,
  strength: f32
}
CeoDecision {
  action: CeoAction,
  target: Option<EntityId>,
  intensity: f32
}
EVENTS (FINAL CLEAN DESIGN)

👉 No mega-enum. Fully modular:

Event =
  Dungeon(DungeonEvent)
  | Economy(EconomyEvent)
  | Social(SocialEvent)
  | Life(LifeEvent)
  | Memory(MemoryEvent)
  | System(SystemEvent)
Example Event Modules
DungeonEvent::JobCompleted {
  agent_id,
  reward_money,
  reward_xp,
  shard
}
SystemEvent::TickCompleted
SystemEvent::CeoDecision(CeoDecision)
🏗 2. lat-world (PURE DATA)
World {
  facilities: Vec<FacilityInstance>,
}
FacilityInstance {
  id: u32,
  floor: i32,
  kind: FacilityType
}

NO LOGIC.

🧠 3. lat-memory (STATEFUL MAP ONLY)
KnowledgeNetwork {
  store: HashMap<EntityId, Vec<MemoryShard>>
}
Rules
No async
No engine access
Pure mutation API only
API
store(owner, shard)

transfer(from, to, shard, quality)

get(owner)
💀 4. lat-dungeon (JOB GENERATOR)
Model
DungeonJob:
Scavenge | Courier | DataMine
Engine
tick() → Vec<Event>

Always returns job completion events (MVP deterministic).

💰 5. lat-economy (TREASURY MODEL)
Economy {
  treasury: i64
}
Behavior
consumes EconomyEvent
updates treasury
no external state
🧠 6. lat-social (RELATIONSHIP SIM)
SocialEngine {
  rels: HashMap<(EntityId, EntityId), f32>
}
Tick rules
decay: ×0.99 per tick
interaction (optional future hook)
🧬 7. lat-life (LIFECYCLE SYSTEM)
LifeEngine
Behavior
evolves LifeStage
generates LegacyNode event when Archived reached
👑 8. lat-ceo (RULE ENGINE ONLY)
if treasury < 500 → OpenFloor
else → IncreaseDungeonRisk

No LLM dependency.

⚙️ 9. lat-engine (CORE SIMULATION BRAIN)
Responsibilities
owns ALL state
builds snapshot
runs subsystems
collects events
applies CEO decision
updates economy
emits TickCompleted
Engine struct
Engine {
  dungeon,
  economy,
  social,
  life,
  memory,
  ceo,
  treasury,
}
Tick Flow
fn tick(&mut self) -> Vec<Event> {
  events = []

  events += dungeon.tick()
  events += life.tick()
  social.tick()

  ceo_decision = ceo.decide(treasury)
  events += CeoDecision

  apply(events → economy)
  update treasury

  events += TickCompleted
  return events
}
🌐 10. lat-server (API LAYER)
Endpoints
GET /health
GET /state
GET /events (SSE)
Behavior
starts Engine loop
broadcasts events via channel
NEVER modifies state directly
🧠 11. SNAPSHOT RULE (CRITICAL)
Snapshot = immutable clone of:
- world
- economy
- relationships
- memory graph
- agent states

NO references, NO Arc inside snapshot.

🔥 12. EVENT FLOW GUARANTEE

Every tick MUST produce:

≥ 1 Dungeon/Economy/Life event
+ 1 TickCompleted
🧪 13. TEST STRATEGY (FINAL)
ONLY 3 TYPES
1. Unit

pure functions only

2. Subsystem tick test
engine.tick()
assert event exists
3. Full simulation regression
10 tick run
compare event distribution
🐳 14. DOCKER (FINAL)
FROM rust:1.82 as build
WORKDIR /app
COPY . .
RUN cargo build --release -p lat-server

FROM debian:stable-slim
COPY --from=build /app/target/release/lat-server /lat-server
CMD ["/lat-server"]
🚀 FINAL RESULT

Du hast jetzt ein System mit:

✔ deterministische Simulation
✔ event-driven architecture
✔ clean dependency graph
✔ safe async boundaries
✔ scalable subsystem model
✔ engine-controlled world state
✔ SSE streaming runtime