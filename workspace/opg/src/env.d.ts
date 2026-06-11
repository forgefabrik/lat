export interface Env {
  OPG_DB: D1Database;
  OPG_ASSETS: R2Bucket;
  OPG_KV: KVNamespace;
  OPG_QUEUE: Queue;
  ADMIN_KEY: string;
  SESSION_SECRET: string;
  KEY_ENCRYPTION_SECRET: string;
  IMAGE_WORKER_SECRET: string;
  IMAGE_WORKER_URL: string;
  APP_ENV: string;
  PUBLIC_APP_NAME: string;
  ASSETS: Fetcher;
}