# SynqSquad Development Guidelines

## Project Overview
SynqSquad is a focused web application for students and researchers to find hackathon and research paper teammates. Verified Google accounts only, direct peer-to-peer contact on Gmail only.

## Architecture
- Framework: Next.js (App Router) + React 19 + TypeScript
- Styling: Custom CSS variables with Tailwind utility tokens. No gradient text, no glow, no emoji icons.
- Persistence: Atomic JSON file engine (`data/`) for zero-dependency runtime resilience.
- Security: Email masking for unauthenticated users, 10/day Gmail connect rate limiting, server-side Zod validation, XSS filtering, anti-spam regex patterns.

## Commands
- Build: `npm run build`
- Lint: `npm run lint`
- Tests: `node --experimental-strip-types tests/unit-tests.mjs`
- Start: `npm run start -- -p 3000`
