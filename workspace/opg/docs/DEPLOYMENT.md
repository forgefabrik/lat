# OPG — Production Deployment Docs

## Deployment Checklist

- Wrangler secrets set (`ADMIN_KEY`, `SESSION_SECRET`, `IMAGE_WORKER_SECRET`, `KEY_ENCRYPTION_SECRET`).
- D1 migrations applied to production (`wrangler d1 migrations apply opg_db --remote`).
- R2 bucket `opg-assets` enabled in production.
- KV namespace bound for job status caching.
- OPG_QUEUE consumer attached and draining.
- Main worker bound with `ASSETS` (frontend/out).
- Image Worker deployed separately with `AI` binding + `API_KEY` secret.
- `PUBLIC_APP_NAME`, `APP_ENV`, `IMAGE_WORKER_URL` set as production vars.

## Deploy Commands

- `wrangler deploy` (main worker)
- `wrangler deploy --config image-worker/wrangler.jsonc` (image worker)
- `wrangler d1 migrations apply opg_db --remote`

## Environment Variables

| Name | Purpose |
|------|---------|
| `ADMIN_KEY` | Admin header auth |
| `SESSION_SECRET` | Session JWT signing |
| `KEY_ENCRYPTION_SECRET` | Encrypt provider keys at rest |
| `IMAGE_WORKER_SECRET` | Sign requests to Image Worker |
| `IMAGE_WORKER_URL` | Main Worker → Image Worker URL |
| `APP_ENV` | `production` / `staging` / `dev` |
| `PUBLIC_APP_NAME` | Frontend title/brand |

## Observability

- Tail traces via `wrangler tail`
- Error spike detection via D1 `agent_events` table
- Queue backlog via `/api/admin/queue` (or `wrangler queues list`)
- Image Worker errors via separate worker logs

## Rollback

- `wrangler rollback --service opg`
- Image Worker rollback is per-route via version ID in Cloudflare dashboard.

## Security Notes

- Provider keys must never be logged or returned in API responses.
- `/api/admin/*` must validate `ADMIN_KEY` header.
- Image Worker requests MUST include valid signature.
- Static assets from `frontend/out` are public — no sensitive logic lives there.
