CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  idea TEXT NOT NULL,
  provider TEXT NOT NULL,
  style TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE game_specs (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  spec_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id)
);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  prompt TEXT,
  width INTEGER,
  height INTEGER,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id)
);

CREATE TABLE pixel_documents (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  asset_id TEXT,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  palette_json TEXT NOT NULL,
  layers_json TEXT NOT NULL,
  history_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE animations (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  asset_id TEXT,
  name TEXT NOT NULL,
  actions_json TEXT NOT NULL,
  grid_json TEXT NOT NULL,
  fps INTEGER NOT NULL,
  loop INTEGER NOT NULL,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE levels (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  name TEXT NOT NULL,
  level_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  game_id TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE agent_events (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  game_id TEXT,
  agent TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE builds (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  status TEXT NOT NULL,
  manifest_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_game_specs_game_id ON game_specs(game_id);
CREATE INDEX idx_assets_game_id ON assets(game_id);
CREATE INDEX idx_pixel_documents_game_id ON pixel_documents(game_id);
CREATE INDEX idx_animations_game_id ON animations(game_id);
CREATE INDEX idx_levels_game_id ON levels(game_id);
CREATE INDEX idx_agent_events_job_id ON agent_events(job_id);
CREATE INDEX idx_builds_game_id ON builds(game_id);
