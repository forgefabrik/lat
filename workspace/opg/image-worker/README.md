# OPG Image Worker

Cloudflare Worker for pixel-art image generation.

## Dev

```bash
cd image-worker
cp .dev.vars.example .dev.vars  # if present
npx wrangler dev --port 8788
```

## Secrets
- `IMAGE_WORKER_SECRET` — only the main OPG worker should call this endpoint.

## Status
Scaffolded. Real AI binding + prompt pipeline is Milestone 9 (opg-agents.md).
