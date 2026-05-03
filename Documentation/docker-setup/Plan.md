# Plan - Docker Setup

## Goal
Dockerize the CookTheDish app so `docker compose up` brings it up and running.

## Approach
1. Create a multi-stage Dockerfile for Next.js (build + production runtime)
2. Create docker-compose.yml with the app service
3. Handle environment variables (ANTHROPIC_API_KEY) via .env file
4. Use Next.js standalone output mode for minimal Docker image
5. Test the full flow in Docker
