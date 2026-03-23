# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run serve          # Start dev server (port 3000)
npm run serve:dev      # Start dev server with env setup

# Build
npm run build:dev      # Development build
npm run build:prod     # Production build

# Lint
npm run lint           # Run ESLint

# Environment
npm run env:setup      # Setup environment variables from submodule
npm run env:validate   # Validate environment configuration
npm run env:show       # Display current environment config

# Mobile
npm run mobile:sync    # Sync Capacitor web assets
npm run mobile:android # Open Android Studio
```

## Environment Setup

Sensitive configuration is stored in a **private git submodule** (`KoSpot-frontend-private`). Before developing:

```bash
git submodule update --init --recursive
node scripts/setup-env.js development setup
```

The dev server proxies `/api` and `/ws` to `localhost:8080`. Kakao Map API key is injected into `index.html` via `vue.config.js`.

## Architecture

**Stack:** Vue 3 (Composition API) + TypeScript + Pinia + Vue Router 4

### Directory Structure

- `src/core/` — Cross-cutting concerns: axios instance with JWT interceptors, auth token storage, WebSocket (STOMP/SockJS) service, composables, platform detection (web vs Capacitor), environment config
- `src/features/` — Feature modules, each self-contained:
  - `game/single/` — Photo and RoadView single-player game modes
  - `game/multiplayer/` — Real-time multiplayer via WebSocket
  - `game/shared/` — Shared game logic and services
  - `auth/` — Login, OAuth (Kakao, Google)
  - `user/` — Profile, settings, inventory
  - `shop/` — In-game economy (coins, items)
  - `friend/`, `admin/`, `notice/`, `main/`, `intro/`
- `src/router/` — Route files split by feature; guards in `index.js`
- `src/store/` — Pinia stores (primary) + legacy Vuex modules (`auth`, `user`, `game`, `ui`)
- `src/shared/` — Assets, global SCSS, TypeScript types, shared utilities

### State Management

Pinia is the primary store. Vuex modules exist for legacy compatibility — prefer Pinia for new code.

### API & Auth Flow

- `src/core/api/` — Single Axios instance; 401 responses trigger automatic token refresh, then retry the original request
- JWT tokens stored in `localStorage`; auth guards in `src/router/index.js` redirect unauthenticated users

### Real-time (WebSocket)

STOMP over SockJS at `VUE_APP_WS_URL`. WebSocket service lives in `src/core/services/`. Multiplayer game state flows through this connection.

### Mobile (Capacitor)

App ID: `com.kospot.app`. Platform detection in `src/core/platform/` gates Capacitor-specific features (deeplinks, push notifications). Build target is controlled by `VUE_APP_PLATFORM_TARGET`.

### Path Alias

`@` maps to `src/` (configured in both `jsconfig.json` and `vue.config.js`).

## AI Assistant Guidelines (from .windsurfrules)

- Respond in **Korean** by default
- Design: soft gradients, clean layout, light theme, black/white text only
- Use open-source images; load Tailwind CSS via CDN when needed
- Eliminate duplicate code; prefer reusing existing components
- Never break existing functionality
