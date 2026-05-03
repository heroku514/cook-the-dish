# Findings - Docker Setup

## 2026-05-03

- Next.js standalone output mode produces a minimal server.js that doesn't need node_modules at runtime — keeps Docker image small.
- The `public/` and `.next/static/` folders must be copied separately into the standalone directory.
- Environment variables (ANTHROPIC_API_KEY) are read at runtime, not build time, so the same image works in demo mode or live mode depending on what's passed via docker-compose env.
- Using `env_file` with `required: false` allows the compose file to work whether or not a `.env` file exists.
