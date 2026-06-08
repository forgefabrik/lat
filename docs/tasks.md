File Structure Overview (final)
├─ Cargo.toml                         # workspace manifest
├─ README.md
├─ IDEE.md
├─ Dockerfile
├─ .dockerignore
├─ .github/
│   └─ workflows/
│       └─ ci.yml
├─ docs/
│   └─ 2026-06-08-lat_full_architecture.md   # this plan will  be saved here 
│   
├─ assets/
│   └─ sprites/… (placeholder PNGs + manifest)
├─ scripts/
│   ├─ generate_placeholder_assets.sh
│   └─ validate_assets.sh
├─ crates/
│   ├─ lat-protocol/
│   ├─ lat-engine/
│   ├─ lat-dungeon/
│   ├─ lat-education/
│   ├─ lat-office/
│   ├─ lat-social/
│   ├─ lat-economy/
│   ├─ lat-life/
│   ├─ lat-memory/
│   ├─ lat-world/
│   └─ lat-ceo/
└─ lat-server/
    └─ src/main.rs
All crates follow the same pattern: Cargo.toml, src/lib.rs, optional src/<module>.rs, and a tests/ directory.

Task 1: lat-protocol – Events & Core Types
Files

Modify: crates/lat-protocol/Cargo.toml (add serde, uuid deps)

Modify: crates/lat-protocol/src/lib.rs


Step 1: Write failing test

use lat_protocol::{Event, AgentId, MemoryShard, MemoryCategory};

#[test]
fn can_serialize_dungeon_job_completed() {
    let e = Event::DungeonJobCompleted {
        agent_id: AgentId(uuid::Uuid::new_v4()),
        job_type: lat_dungeon::DungeonJob::Scavenging,
        reward_money: 5,
        reward_xp: 5,
        memory_shard: None,
    };
    let s = serde_json::to_string(&e).unwrap();
    let d: Event = serde_json::from_str(&s).unwrap();
    matches!(d, Event::DungeonJobCompleted { .. });
}

Step 2: Run (fails).


Step 3: Implement core types

// lat-protocol/src/lib.rs (excerpt)
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Unique identifier for any entity (Agent, LegacyNode, SystemNode)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct EntityId(pub Uuid);

/// Agent identifier – alias for clarity
pub type AgentId = EntityId;

/// Enum for life stages
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LifeStage {
    Kindergarten,
    School,
    University,
    Junior,
    Worker,
    Senior,
    Mentor,
    Retired,
    Archived,
    LegacyNode,
}

/// Shift enum (used by many layers)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Shift {
    Morning,
    Afternoon,
    Night,
}

/// Memory categories (cognitive layer)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MemoryCategory {
    Skill,
    Social,
    Trauma,
    Economic,
    System,
}

/// Memory shard – owned by a *MemoryNode* (Agent, LegacyNode, SystemNode)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryShard {
    pub id: Uuid,
    pub owner: EntityId,          // abstract owner
    pub category: MemoryCategory,
    pub value: u32,
    pub transferable: bool,
}

/// Facility types (physical layer)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FacilityType {
    Office,
    Supermarket,
    Gym,
    Pool,
    Bar,
    School,
    University,
    Kindergarten,
    RetirementHome,
    Crematorium,
    Dormitory,
    Cafeteria,
    MeetingRoom,
    ServerRoom,
    Dungeon,
}

/// Need categories (societal layer)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Needs {
    pub hunger: f32,
    pub energy: f32,
    pub social: f32,
    pub safety: f32,
    pub purpose: f32,
}

impl Default for Needs {
    fn default() -> Self {
        Self {
            hunger: 0.0,
            energy: 100.0,
            social: 50.0,
            safety: 100.0,
            purpose: 50.0,
        }
    }
}

/// Relationship types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RelationshipType {
    Friendship,
    Rivalry,
    Mentor,
    Apprentice,
}

/// Relationship struct
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relationship {
    pub a: EntityId,
    pub b: EntityId,
    pub type_: RelationshipType,
    pub strength: f32,
}

/// CEO actions
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CeoAction {
    OpenFloor,
    CloseFloor,
    IncreaseDungeonRisk,
    AdjustEducationBudget,
    DeleteMemory,
    StrengthenMemory,
    PromoteAgent,
    DegradeAgent,
}

/// CEO decision payload (sent as an event)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CeoDecision {
    pub action: CeoAction,
    pub target: Option<EntityId>,
    pub intensity: f32,
}

/// Core event enum – every subsystem pushes into this
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Event {
    // Physical layer
    DungeonJobCompleted {
        agent_id: AgentId,
        job_type: lat_dungeon::DungeonJob,
        reward_money: i64,
        reward_xp: u32,
        memory_shard: Option<MemoryShard>,
    },
    FacilityUsed {
        agent_id: AgentId,
        facility_id: u32,
        facility_type: FacilityType,
    },

    // Cognitive layer
    MemoryAdded { shard: MemoryShard },
    KnowledgeTransfer {
        from: EntityId,
        to: EntityId,
        skill: MemoryShard,
        transfer_quality: f32,
    },
    ResearchProjectFinished {
        project_id: Uuid,
        output: MemoryShard,
    },

    // Societal layer
    RelationshipChanged { rel: Relationship },
    NeedsUpdated { agent_id: AgentId, needs: Needs },

    // Lifecycle
    LifeStageChanged {
        agent_id: AgentId,
        from: LifeStage,
        to: LifeStage,
    },
    LegacyNodeCreated { node_id: EntityId },

    // Economy
    EconomyUpdate { treasury_balance: i64 },

    // CEO
    CeoDecisionMade { decision: CeoDecision },

    // Misc
    TickCompleted,
    // internal schema version for forward compatibility
    #[serde(skip)]
    _schema_version: u32,
}

Step 4: Run test (passes).


Step 5: Commit

git add crates/lat-protocol/src/lib.rs
git commit -m "feat(lat-protocol): core types & events with EntityId ownership"
Task 2: lat-memory – Memory Nodes & Knowledge Network
Files

Create: crates/lat-memory/Cargo.toml

Create: crates/lat-memory/src/lib.rs

Test: crates/lat-memory/tests/knowledge_network.rs


Step 1: Write failing test

use lat_memory::{KnowledgeNetwork, KnowledgeTransfer};
use lat_protocol::{EntityId, MemoryShard, MemoryCategory};

#[tokio::test]
async fn transfer_between_agent_and_legacy_node() {
    let net = KnowledgeNetwork::new();

    let agent = EntityId(uuid::Uuid::new_v4());
    let legacy = EntityId(uuid::Uuid::nil()); // sentinel for legacy node

    // agent owns a skill shard
    let shard = MemoryShard {
        id: uuid::Uuid::new_v4(),
        owner: agent,
        category: MemoryCategory::Skill,
        value: 30,
        transferable: true,
    };
    net.store_shard(agent, shard.clone()).await;

    // transfer to legacy node with 0.8 quality
    let tx = KnowledgeTransfer {
        from: agent,
        to: legacy,
        skill: shard,
        transfer_quality: 0.8,
    };
    net.apply_transfer(tx).await;

    let legacy_shards = net.get_shards(legacy);
    assert_eq!(legacy_shards.len(), 1);
    assert_eq!(legacy_shards[0].owner, legacy);
}

Step 2: Run (fails).


Step 3: Implement crate

crates/lat-memory/Cargo.toml

[package]
name = "lat-memory"
version = "0.1.0"
edition = "2021"

[dependencies]
lat-protocol = { path = "../../crates/lat-protocol" }
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["rt-multi-thread"] }
uuid = { version = "1", features = ["serde","v4"] }
src/lib.rs

use lat_protocol::{EntityId, MemoryShard};
use std::collections::HashMap;
use tokio::sync::RwLock;

/// Public transfer struct – used by both the engine and external observers
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct KnowledgeTransfer {
    pub from: EntityId,
    pub to: EntityId,
    pub skill: MemoryShard,
    pub transfer_quality: f32,
}

/// KnowledgeNetwork holds all shards grouped by abstract MemoryNode (EntityId)
pub struct KnowledgeNetwork {
    store: RwLock<HashMap<EntityId, Vec<MemoryShard>>>,
}

impl KnowledgeNetwork {
    pub fn new() -> Self {
        Self {
            store: RwLock::new(HashMap::new()),
        }
    }

    pub async fn store_shard(&self, owner: EntityId, shard: MemoryShard) {
        let mut map = self.store.write().await;
        map.entry(owner).or_default().push(shard);
    }

    /// Apply a transfer – creates a copy scaled by quality, reassigns owner.
    pub async fn apply_transfer(&self, tx: KnowledgeTransfer) {
        let mut new_shard = tx.skill.clone();
        new_shard.value = ((new_shard.value as f32) * tx.transfer_quality) as u32;
        new_shard.owner = tx.to;
        self.store_shard(tx.to, new_shard).await;
    }

    /// Retrieve all shards owned by a node (clone for test convenience)
    pub fn get_shards(&self, owner: EntityId) -> Vec<MemoryShard> {
        let guard = futures::executor::block_on(self.store.read());
        guard.get(&owner).cloned().unwrap_or_default()
    }

    /// Called each engine tick – placeholder for future decay/fusion logic.
    pub async fn propagate(&self) { /* no‑op for MVP */ }
}

Step 4: Run test (passes).


Step 5: Commit

git add crates/lat-memory
git commit -m "feat(lat-memory): memory node model + knowledge network"
Task 3: lat-dungeon – Entry Economy Layer (Hybrid Job Model)
Files

Modify: crates/lat-dungeon/Cargo.toml (add rand dep)

Modify: crates/lat-dungeon/src/lib.rs (add duration_ticks field, keep MVP single‑tick)

Test: crates/lat-dungeon/tests/job_progress.rs


Step 1: Write failing test

use lat_dungeon::{DungeonEngine, DungeonJob};

#[tokio::test]
async fn single_tick_job_is_completed_immediately() {
    let mut eng = DungeonEngine::new();
    let agent = lat_protocol::AgentId(uuid::Uuid::new_v4());
    eng.enqueue_job(agent, DungeonJob::Scavenging);
    let outcome = eng.tick().await;
    matches!(outcome, lat_dungeon::DungeonOutcome::JobCompleted { .. });
}

Step 2: Run (fails).


Step 3: Implement hybrid job struct

// src/entry_jobs/mod.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum DungeonJob {
    Scavenging,
    CourierRuns,
    DataScraping,
    MaintenanceTasks,
}

/// JobProgress carries optional duration for future multi‑tick support.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct JobProgress {
    pub job: DungeonJob,
    pub duration_ticks: u32, // 0 = instant (MVP)
    pub progress: u32,
}
Engine changes (excerpt):

pub struct DungeonEngine {
    queue: VecDeque<(AgentId, JobProgress)>,
}

impl DungeonEngine {
    pub fn new() -> Self { Self { queue: VecDeque::new() } }

    pub fn enqueue_job(&mut self, agent: AgentId, job: DungeonJob) {
        // MVP: single‑tick => duration 0
        let prog = JobProgress { job, duration_ticks: 0, progress: 0 };
        self.queue.push_back((agent, prog));
    }

    pub async fn tick(&mut self) -> DungeonOutcome {
        if let Some((agent, mut prog)) = self.queue.pop_front() {
            if prog.duration_ticks == 0 {
                // instant completion
                let reward = dungeon_economy::calculate_reward(&prog.job);
                let mem = dungeon_rewards::maybe_create_shard(&prog.job);
                DungeonOutcome::JobCompleted {
                    agent_id: agent,
                    job_type: prog.job,
                    reward_money: reward,
                    reward_xp: reward as u32,
                    memory_shard: mem,
                }
            } else {
                // future: increment progress, re‑queue if not done
                prog.progress += 1;
                if prog.progress >= prog.duration_ticks {
                    // produce same outcome as above
                    let reward = dungeon_economy::calculate_reward(&prog.job);
                    let mem = dungeon_rewards::maybe_create_shard(&prog.job);
                    DungeonOutcome::JobCompleted {
                        agent_id: agent,
                        job_type: prog.job,
                        reward_money: reward,
                        reward_xp: reward as u32,
                        memory_shard: mem,
                    }
                } else {
                    self.queue.push_back((agent, prog));
                    DungeonOutcome::InProgress
                }
            }
        } else {
            DungeonOutcome::NoJob
        }
    }
}
Add DungeonOutcome::InProgress variant.


Step 4: Run test (passes).


Step 5: Commit

git add crates/lat-dungeon
git commit -m "feat(lat-dungeon): hybrid job model with single‑tick default"
Task 4: lat-world – Physical Layer, Floors & Facilities (Flat List + Tagging)
Files

Create: crates/lat-world/Cargo.toml

Create: crates/lat-world/src/lib.rs

Test: crates/lat-world/tests/facility_management.rs


Step 1: Write failing test

use lat_world::{World, FacilityInstance, FacilityType, Tag};

#[test]
fn can_place_facilities_on_floors_with_tags() {
    let mut world = World::new();
    let fac = FacilityInstance {
        id: 1,
        facility_type: FacilityType::Bar,
        floor_id: -1,
        capacity: 10,
        tags: vec![Tag::Social],
    };
    world.add_facility(fac);
    assert_eq!(world.facilities.len(), 1);
}

Step 2: Run (fails).


Step 3: Implement world struct

crates/lat-world/Cargo.toml

[package]
name = "lat-world"
version = "0.1.0"
edition = "2021"

[dependencies]
lat-protocol = { path = "../../crates/lat-protocol" }
serde = { version = "1", features = ["derive"] }
src/lib.rs

use lat_protocol::{FacilityType, EntityId};
use serde::{Deserialize, Serialize};

/// Simple tag enum for facility categorisation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Tag {
    Social,
    Economic,
    Educational,
    Residential,
    Technical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FacilityInstance {
    pub id: u32,
    pub facility_type: FacilityType,
    pub floor_id: i32,
    pub capacity: usize,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct World {
    pub floors: Vec<i32>,               // just identifiers for now
    pub facilities: Vec<FacilityInstance>,
    pub agents_on_floor: HashMap<i32, Vec<EntityId>>,
    // Additional maps (e.g., floor capacities) can be added later
}

impl World {
    pub fn new() -> Self {
        Self {
            floors: vec![-2, -1, 0, 1, 2, 3, 4, 5],
            facilities: vec![],
            agents_on_floor: HashMap::new(),
        }
    }

    pub fn add_facility(&mut self, fac: FacilityInstance) {
        self.facilities.push(fac);
    }

    /// Retrieve all facilities on a given floor
    pub fn facilities_on_floor(&self, floor: i32) -> Vec<&FacilityInstance> {
        self.facilities.iter().filter(|f| f.floor_id == floor).collect()
    }
}

Step 4: Run test (passes).


Step 5: Commit

git add crates/lat-world
git commit -m "feat(lat-world): flat facility list with tagging and floor IDs"
Task 5: lat-ceo – Dual‑Mode CEO (Rule Engine + Optional LLM Adapter)
Files

Create: crates/lat-ceo/Cargo.toml

Create: crates/lat-ceo/src/lib.rs

Create: crates/lat-ceo/src/rule_engine.rs

Create: crates/lat-ceo/src/llm_adapter.rs (feature‑gated)

Test: crates/lat-ceo/tests/decision.rs


Step 1: Write failing test

use lat_ceo::{CeoController, CeoAction};

#[test]
fn rule_engine_opens_floor_when_treasury_low() {
    let mut ctrl = CeoController::new();
    let world_state = lat_world::WorldSnapshot {
        treasury_balance: 200,
        ..Default::default()
    };
    let decision = ctrl.decide(&world_state);
    assert_eq!(decision.action, CeoAction::OpenFloor);
}

Step 2: Run (fails).


Step 3: Implement rule engine

crates/lat-ceo/Cargo.toml

[package]
name = "lat-ceo"
version = "0.1.0"
edition = "2021"

[dependencies]
lat-protocol = { path = "../../crates/lat-protocol" }
lat-world = { path = "../../crates/lat-world" }
serde = { version = "1", features = ["derive"] }

# Optional LLM integration – only compiled when `llm` feature is enabled
[features]
llm = []
src/rule_engine.rs

use lat_protocol::{CeoAction, CeoDecision};
use lat_world::WorldSnapshot;

/// Simple deterministic rule set – always available
pub struct RuleEngine;

impl RuleEngine {
    pub fn new() -> Self { Self }

    pub fn decide(&self, snap: &WorldSnapshot) -> CeoDecision {
        // Example rule: if treasury < 500 → open new floor
        if snap.treasury_balance < 500 {
            CeoDecision {
                action: CeoAction::OpenFloor,
                target: None,
                intensity: 1.0,
            }
        } else {
            // otherwise increase dungeon risk slightly
            CeoDecision {
                action: CeoAction::IncreaseDungeonRisk,
                target: None,
                intensity: 0.2,
            }
        }
    }
}
src/llm_adapter.rs (guarded by #[cfg(feature = "llm")])

#[cfg(feature = "llm")]
pub mod llm_adapter {
    use super::RuleEngine;
    use lat_protocol::CeoDecision;
    use lat_world::WorldSnapshot;

    /// Placeholder – in real code you would call LM Studio API,
    /// feed `WorldSnapshot` as JSON, get back a decision JSON,
    /// deserialize to `CeoDecision` and possibly override.
    pub async fn overriden_decision(rule: &RuleEngine, snap: &WorldSnapshot) -> CeoDecision {
        // For now just delegate to rule engine
        rule.decide(snap)
    }
}
src/lib.rs

use lat_protocol::CeoDecision;
use lat_world::WorldSnapshot;
use crate::rule_engine::RuleEngine;

pub struct CeoController {
    rule_engine: RuleEngine,
    #[cfg(feature = "llm")]
    // In a real implementation this could hold an LLM client handle
    llm_enabled: bool,
}

impl CeoController {
    pub fn new() -> Self {
        Self {
            rule_engine: RuleEngine::new(),
            #[cfg(feature = "llm")]
            llm_enabled: false,
        }
    }

    /// Public entry point used by the engine each tick.
    pub async fn decide(&self, snap: &WorldSnapshot) -> CeoDecision {
        #[cfg(feature = "llm")]
        {
            if self.llm_enabled {
                return llm_adapter::overriden_decision(&self.rule_engine, snap).await;
            }
        }
        // fallback to pure rule engine
        self.rule_engine.decide(snap)
    }

    #[cfg(feature = "llm")]
    pub fn enable_llm(&mut self) {
        self.llm_enabled = true;
    }
}

Step 4: Run test (passes).


Step 5: Commit

git add crates/lat-ceo
git commit -m "feat(lat-ceo): dual‑mode controller with rule engine and optional LLM overlay"
Task 6: lat-engine – Snapshot‑Based Orchestration & Resonance
Files

Modify: crates/lat-engine/Cargo.toml (add dependencies on all other crates)

Modify: crates/lat-engine/src/lib.rs (core tick loop)

Create: crates/lat-engine/src/snapshot.rs (WorldSnapshot definition)

Create: crates/lat-engine/src/resonance.rs

Tests: crates/lat-engine/tests/full_tick.rs


Step 1: Write failing test

use lat_engine::{Engine, WorldSnapshot};

#[tokio::test]
async fn engine_produces_snapshot_and_emits_events() {
    let mut engine = Engine::new();
    // Populate with one agent to keep it simple
    engine.spawn_initial_agents(1);
    let events = engine.tick().await;
    // Expect at least a DungeonJobCompleted and TickCompleted
    assert!(events.iter().any(|e| matches!(e, lat_protocol::Event::DungeonJobCompleted { .. })));
    assert!(events.iter().any(|e| matches!(e, lat_protocol::Event::TickCompleted)));
}

Step 2: Run (fails).


Step 3: Define WorldSnapshot

src/snapshot.rs

use lat_protocol::{AgentId, EntityId, MemoryShard, Needs, Relationship, FacilityInstance};
use std::collections::HashMap;

/// Immutable snapshot taken at the start of each tick.
#[derive(Debug, Clone)]
pub struct WorldSnapshot {
    pub agents: HashMap<AgentId, AgentState>,
    pub facilities: Vec<FacilityInstance>,
    pub memory_graph: HashMap<EntityId, Vec<MemoryShard>>,
    pub economy: EconomyState,
    pub relationships: Vec<Relationship>,
    pub ceo_state: CeoState,
    pub resonance: Resonance,
}

/// Per‑agent mutable state (flattended for snapshot)
#[derive(Debug, Clone)]
pub struct AgentState {
    pub needs: Needs,
    pub shift: lat_protocol::Shift,
    pub life_stage: lat_protocol::LifeStage,
    pub wallet: lat_economy::Wallet,
    pub xp: u32,
}

/// Simplified economy snapshot
#[derive(Debug, Clone)]
pub struct EconomyState {
    pub treasury_balance: i64,
    pub total_salary_paid: i64,
    pub total_revenue: i64,
}

/// CEO state stored in snapshot (could include last decision etc.)
#[derive(Debug, Clone)]
pub struct CeoState {
    pub last_action: Option<lat_protocol::CeoAction>,
    pub last_intensity: f32,
}

/// Resonance vector – influences spawn rates, rewards, etc.
#[derive(Debug, Clone, Default)]
pub struct Resonance {
    pub economic: f32,
    pub social: f32,
    pub cognitive: f32,
}
Resonance Update Logic (src/resonance.rs)
use super::snapshot::Resonance;

/// Called after each tick to update resonance based on the events emitted.
pub fn update_resonance(res: &mut Resonance, events: &[lat_protocol::Event]) {
    for ev in events {
        match ev {
            lat_protocol::Event::DungeonJobCompleted { .. } => {
                res.economic += 0.05;
            }
            lat_protocol::Event::RelationshipChanged { .. } => {
                res.social += 0.04;
            }
            lat_protocol::Event::ResearchProjectFinished { .. } => {
                res.cognitive += 0.06;
            }
            _ => {}
        }
    }
    // decay each component slowly to avoid runaway growth
    res.economic = (res.economic * 0.98).max(0.0);
    res.social = (res.social * 0.98).max(0.0);
    res.cognitive = (res.cognitive * 0.98).max(0.0);
}
Engine Core (src/lib.rs)
use lat_protocol::Event;
use std::sync::Arc;
use tokio::sync::RwLock;

mod snapshot;
mod resonance;

use snapshot::{WorldSnapshot, AgentState, EconomyState, CeoState, Resonance};
use resonance::update_resonance;

// Sub‑engine imports
use lat_dungeon::DungeonEngine;
use lat_education::EducationEngine;
use lat_office::OfficeEngine;
use lat_social::SocialEngine;
use lat_economy::EconomyEngine;
use lat_life::LifeEngine;
use lat_memory::KnowledgeNetwork;
use lat_ceo::CeoController;
use lat_world::World;

pub struct Engine {
    // immutable snapshot source (read‑only for sub‑engines)
    world: Arc<RwLock<World>>,
    // sub‑engines
    dungeon: DungeonEngine,
    education: EducationEngine,
    office: OfficeEngine,
    social: SocialEngine,
    economy: EconomyEngine,
    life: LifeEngine,
    knowledge: KnowledgeNetwork,
    ceo: CeoController,
    // resonance accumulator
    resonance: Resonance,
}

impl Engine {
    pub fn new() -> Self {
        Self {
            world: Arc::new(RwLock::new(World::new())),
            dungeon: DungeonEngine::new(),
            education: EducationEngine::new(),
            office: OfficeEngine::new(),
            social: SocialEngine::new(),
            economy: EconomyEngine::new(),
            life: LifeEngine::new(),
            knowledge: KnowledgeNetwork::new(),
            ceo: CeoController::new(),
            resonance: Resonance::default(),
        }
    }

    /// Helper for tests – spawns N fresh agents directly into the world snapshot.
    pub fn spawn_initial_agents(&mut self, count: usize) {
        let mut world = futures::executor::block_on(self.world.write());
        for _ in 0..count {
            let agent_id = lat_protocol::AgentId(uuid::Uuid::new_v4());
            world.agents_on_floor.entry(0).or_default().push(agent_id);
            // initial agent state in snapshot will be built in `build_snapshot`
        }
    }

    /// Build a fresh immutable snapshot from the current world + sub‑engine states.
    fn build_snapshot(&self) -> WorldSnapshot {
        // For brevity we copy only a few fields – full implementation copies all
        let world = futures::executor::block_on(self.world.read());
        WorldSnapshot {
            agents: HashMap::new(), // populated later by each sub‑engine if needed
            facilities: world.facilities.clone(),
            memory_graph: HashMap::new(),
            economy: EconomyState {
                treasury_balance: self.economy.treasury_balance(),
                total_salary_paid: 0,
                total_revenue: 0,
            },
            relationships: self.social.current_relationships(),
            ceo_state: CeoState { last_action: None, last_intensity: 0.0 },
            resonance: self.resonance.clone(),
        }
    }

    /// Main deterministic tick – runs all 11 steps on a snapshot + diff.
    pub async fn tick(&mut self) -> Vec<Event> {
        // 1. Build snapshot (read‑only view)
        let mut snapshot = self.build_snapshot();

        // 2‑10. Run each sub‑engine, mutating the snapshot or emitting events.
        let mut events = vec![];

        // 1. Spawn agents → Dungeon (handled inside spawn logic)
        // 2. Dungeon
        events.extend(self.dungeon.tick().await.into_iter().map(Event::from));

        // 3. Education
        events.extend(self.education.tick().await);

        // 4. Office
        events.extend(self.office.tick().await);

        // 5. Social
        events.extend(self.social.tick().await);

        // 6. Needs update (directly on agents)
        events.extend(self.update_needs(&mut snapshot));

        // 7. Economy update
        events.extend(self.economy.tick().await);

        // 8. Life stage evolution
        events.extend(self.life.tick().await);

        // 9. Knowledge propagation
        self.knowledge.propagate().await;
        // (Knowledge transfers are emitted by other layers as events)

        // 10. CEO decision injection
        let ceo_dec = self.ceo.decide(&snapshot).await;
        events.push(Event::CeoDecisionMade { decision: ceo_dec.clone() });
        // Apply any side‑effects of the decision to the snapshot (e.g., open floor)
        self.apply_ceo_decision(&mut snapshot, ceo_dec);

        // 11. Append TickCompleted marker
        events.push(Event::TickCompleted);

        // Update resonance based on events emitted this tick
        update_resonance(&mut self.resonance, &events);

        // Return events for broadcasting
        events
    }

    fn update_needs(&self, snap: &mut WorldSnapshot) -> Vec<Event> {
        let mut ev = vec![];
        for (agent_id, state) in snap.agents.iter_mut() {
            state.needs.tick();
            ev.push(Event::NeedsUpdated {
                agent_id: *agent_id,
                needs: state.needs.clone(),
            });
        }
        ev
    }

    fn apply_ceo_decision(&mut self, snap: &mut WorldSnapshot, decision: lat_protocol::CeoDecision) {
        match decision.action {
            lat_protocol::CeoAction::OpenFloor => {
                // Add a new floor on top (+1 higher than current max)
                let max = snap.facilities.iter().map(|f| f.floor_id).max().unwrap_or(5);
                snap.facilities.push(FacilityInstance {
                    id: (snap.facilities.len() + 1) as u32,
                    facility_type: lat_protocol::FacilityType::Office,
                    floor_id: max + 1,
                    capacity: 20,
                    tags: vec![Tag::Economic],
                });
            }
            _ => { /* other actions can be stubbed for now */ }
        }
    }
}
Conversion Helper (to map sub‑engine outcomes to Event)
impl From<lat_dungeon::DungeonOutcome> for Event {
    fn from(out: lat_dungeon::DungeonOutcome) -> Self {
        match out {
            lat_dungeon::DungeonOutcome::JobCompleted {
                agent_id,
                job_type,
                reward_money,
                reward_xp,
                memory_shard,
            } => Event::DungeonJobCompleted {
                agent_id,
                job_type,
                reward_money,
                reward_xp,
                memory_shard,
            },
            _ => Event::TickCompleted, // placeholder for other outcomes
        }
    }
}

Step 4: Run test (passes).


Step 5: Commit

git add crates/lat-engine
git commit -m "feat(lat-engine): snapshot‑based tick loop + resonance system"
Task 7: lat-social – Relationship Decay & Inertia
Files

Modify: crates/lat-social/Cargo.toml (add serde)

Modify: crates/lat-social/src/lib.rs (add decay logic)

Test: crates/lat-social/tests/decay.rs


Step 1: Write failing test

use lat_social::{SocialEngine, Relationship, RelationshipType};

#[tokio::test]
async fn relationship_decays_and_is_stabilized_by_interaction() {
    let mut engine = SocialEngine::new();
    let a = lat_protocol::EntityId(uuid::Uuid::new_v4());
    let b = lat_protocol::EntityId(uuid::Uuid::new_v4());

    // create strong friendship
    engine.add_relationship(Relationship {
        a,
        b,
        type_: RelationshipType::Friendship,
        strength: 0.9,
    });

    // run a few ticks without interaction — should decay slowly
    for _ in 0..5 {
        engine.tick().await;
    }
    let rel = engine.get_relationship(a, b).unwrap();
    assert!(rel.strength < 0.9 && rel.strength > 0.5);

    // now add a positive interaction (+0.4) and tick again – strength should rise
    engine.record_interaction(a, b, 0.4);
    engine.tick().await;
    let rel2 = engine.get_relationship(a, b).unwrap();
    assert!(rel2.strength > rel.strength);
}

Step 2: Run (fails).


Step 3: Implement decay with inertia

pub struct SocialEngine {
    relationships: HashMap<(EntityId, EntityId), Relationship>,
    interactions: Vec<(EntityId, EntityId, f32)>,
    decay_rate: f32, // base decay per tick
}

impl SocialEngine {
    pub fn new() -> Self {
        Self {
            relationships: HashMap::new(),
            interactions: vec![],
            decay_rate: 0.01,
        }
    }

    pub fn add_relationship(&mut self, rel: Relationship) {
        let key = if rel.a.0 < rel.b.0 { (rel.a, rel.b) } else { (rel.b, rel.a) };
        self.relationships.insert(key, rel);
    }

    pub fn record_interaction(&mut self, a: EntityId, b: EntityId, impact: f32) {
        self.interactions.push((a, b, impact));
    }

    pub async fn tick(&mut self) {
        // Apply interaction boosts
        for (a, b, impact) in self.interactions.drain(..) {
            let key = if a.0 < b.0 { (a, b) } else { (b, a) };
            if let
10:55 PM

Pasted text.txt
weiter
11:04 PM
Continuation – Task 7 (SocialEngine decay & inertia) – complete implementation
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
Test (already added in tests/decay.rs) passes.

Commit

git add crates/lat-social/src/lib.rs
git commit -m "feat(lat-social): relationship decay with inertia and interaction handling"
Task 8: lat-economy – Money Flow & Treasury
Files

Create: crates/lat-economy/Cargo.toml

Create: crates/lat-economy/src/lib.rs

Test: crates/lat-economy/tests/economy_cycle.rs


Step 1: Write failing test

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

Step 2: Run (fails).


Step 3: Implement crate

crates/lat-economy/Cargo.toml

[package]
name = "lat-economy"
version = "0.1.0"
edition = "2021"

[dependencies]
lat-protocol = { path = "../../crates/lat-protocol" }
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["rt-multi-thread"] }
src/lib.rs

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

Step 4: Run test (passes).


Step 5: Commit

git add crates/lat-economy
git commit -m "feat(lat-economy): simple treasury, salary, revenue handling"
Task 9: lat-office – Salary Production & Facility Effects (Office Layer)
Files

Create: crates/lat-office/Cargo.toml

Create: crates/lat-office/src/lib.rs

Test: crates/lat-office/tests/office_flow.rs


Step 1: Write failing test

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

Step 2: Run (fails).


Step 3: Implement crate

crates/lat-office/Cargo.toml

[package]
name = "lat-office"
version = "0.1.0"
edition = "2021"

[dependencies]
lat-protocol = { path = "../../crates/lat-protocol" }
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["rt-multi-thread"] }
src/lib.rs

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

Step 4: Run test (passes).


Step 5: Commit

git add crates/lat-office
git commit -m "feat(lat-office): office revenue generation + XP multiplier"
Task 10: lat-life – LegacyNode as Knowledge Server & LifeStage Evolution
Files

Modify: crates/lat-life/Cargo.toml (add lat-protocol dep if not already)

Modify: crates/lat-life/src/lib.rs (add LegacyNode handling)

Test: crates/lat-life/tests/lifecycle.rs


Step 1: Write failing test

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

Step 2: Run (fails).


Step 3: Implement legacy handling

src/lib.rs

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

Step 4: Run test (passes).


Step 5: Commit

git add crates/lat-life
git commit -m "feat(lat-life): legacy node creation and life‑stage progression"
Task 11: lat-world – WorldSnapshot Integration (already defined in Engine)
We already added WorldSnapshot in lat-engine. No further code needed here beyond the flat facility list (Task 4).

Additional helper: expose a method to retrieve the current snapshot for external observers (e.g., API).

impl Engine {
    pub async fn current_snapshot(&self) -> WorldSnapshot {
        self.build_snapshot()
    }
}
Commit already done with Engine changes.

Task 12: lat-server – SSE API with Explicit Port Handling
Files

Modify: lat-server/Cargo.toml (add actix‑web, tokio, clap for args)

Modify: lat-server/src/main.rs (port parsing, start Engine, stream events)

Test: lat-server/tests/server_startup.rs (ensure error on missing port)


Step 1: Write failing test

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

Step 2: Run (fails).


Step 3: Implement server

lat-server/Cargo.toml

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
src/main.rs

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

Step 4: Run test (passes).


Step 5: Commit

git add lat-server
git commit -m "feat(lat-server): explicit port handling, SSE endpoint, background engine loop"
Task 13: CI / CD – GitHub Actions & Docker Integration
File: .github/workflows/ci.yml (already created in earlier tasks, but now we add steps for the resonance system and CEO dual‑mode).

Add a matrix build that runs with and without the llm feature to ensure the code compiles both ways.
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
Commit the updated workflow.
git add .github/workflows/ci.yml
git commit -m "ci: test both default and llm feature, ensure asset pipeline runs"
Task 14: Dockerfile – final production image (already added earlier)
Add the optional ARG ENABLE_LLM to toggle the feature at build time.

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
Commit Dockerfile:

git add Dockerfile
git commit -m "docker: multi‑stage build with optional LLM feature flag"
Task 15: Documentation – Markdown files
README.md – high‑level description, build/run commands, Docker usage, description of the three layers, explanation of the resonance system, and note about the non‑standard port requirement.
docs/architecture.md – diagram (ASCII or Mermaid) illustrating the three layers, the snapshot flow, and the tick order.
docs/superpowers/plans/2026-06-08-lat_full_architecture.md – this document (the plan) saved automatically by the writing-plans skill.
Create & commit:

git add README.md docs/architecture.md docs/superpowers/plans/2026-06-08-lat_full_architecture.md
git commit -m "docs: add README, architecture overview, and save full plan"
Task 16: Test Coverage – Add tarpaulin (optional but recommended)
Add dev‑dependency in the workspace root:

[dev-dependencies]
cargo-tarpaulin = "0.22"
Add a CI step (optional) after the test step:

      - name: Coverage
        run: cargo tarpaulin --out Xml
Commit changes to Cargo.toml (workspace root) and CI file.

git add Cargo.toml .github/workflows/ci.yml
git commit -m "ci: add coverage step with cargo‑tarpaulin"
Task 17: Final Repository Clean‑Up & Tagging
Run cargo fmt and ensure no formatting warnings.
Run cargo clippy across the whole workspace (already in CI).
Tag the repository with an initial version tag.
git tag -a v0.1.0 -m "Initial LAT core implementation"
git push origin v0.1.0
Summary of All Tasks (checkbox view)
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
All tasks are now defined with concrete file paths, code snippets, tests, CI steps, and commit commands. The LAT system is ready for implementation by a developer or sub‑agent following the checklist above.