use serde::{Deserialize, Serialize};

/// All events that flow through the simulation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Event {
    AgentSpawned { agent_id: uuid::Uuid },
    JobCompleted { agent_id: uuid::Uuid, job: String, xp: u64, money: i64 },
    XpGained { agent_id: uuid::Uuid, amount: u64 },
    MoneyChanged { amount: i64 },
    RelationshipUpdated { from: uuid::Uuid, to: uuid::Uuid, delta: i32 },
    LifeStageChanged { agent_id: uuid::Uuid, from: Stage, to: Stage },
    FacilityUsed { agent_id: uuid::Uuid, facility: String },
    CeoDecision { decision: String },
    Tick,
}

use super::types::Stage;
