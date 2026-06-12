# CLAUDE.md

Guidance for AI assistants working in this repository.

## Project Overview

A prototype 2D top-down action-adventure game ("Verdant Chronicles", Alundra/Zelda-like), built with React 18 + TypeScript and the Phaser 4 game engine, bundled by Vite. Scaffolded from a Bolt.new Vite/React starter. Currently implements a procedurally generated grass world with trees, an 8-directional player with jumping, a health system, and a React HUD overlay.

## Commands

- `npm run dev` — start Vite dev server (default http://localhost:5173)
- `npm run build` — type-check (`tsc -b`) then `vite build` to `dist/`
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm run typecheck` — `tsc --noEmit -p tsconfig.app.json`
- `npm run preview` — serve the production build locally

There is no test framework and no CI configured. Verify changes with `npm run typecheck` and `npm run lint`.

## Architecture

The codebase has two sides with a narrow bridge between them:

**React side (UI shell):**
- `src/main.tsx` → `src/App.tsx` — layout: TitleBar, game area, StatusBar
- `src/components/GameCanvas.tsx` — owns the `Phaser.Game` instance in a ref (created once on mount, destroyed on unmount). Holds React state for HP and jump status, renders the `HUD` overlay on top of the canvas.
- `src/components/HUD.tsx` — hearts display + control hints, pure React/Tailwind

**Phaser side (game logic), all in `src/game/`:**
- `GameConfig.ts` — config factory (`createGameConfig`): Arcade physics with no gravity, `RESIZE` scale mode, `pixelArt: true`
- `MainScene.ts` — the single scene: builds a 60×60 procedural tilemap, places 40 trees, spawns the player, camera follow with lerp and 1.5x zoom (`setupCamera`), y-coordinate-based depth sorting for the top-down overlap effect (re-applied to the player every `update`)
- `Player.ts` — extends `Phaser.GameObjects.Container` with an Arcade body. 8-directional movement (arrows/WASD), jump (Z/Space) via tweened `jumpOffset`, HP with i-frames (`takeDamage`/`heal`), step-bob animation
- `TextureFactory.ts` — all textures are generated at runtime with Phaser Graphics (grass tileset, player, shadow, hearts). There are **no image assets** in the repo; add new art here, not as files
- `constants.ts` — single source for all tunables (TILE_SIZE, PLAYER_SPEED, MAX_HP, etc.) and the `GAME_EVENTS` names

**The bridge (Phaser → React):** game objects emit on the global event bus — `this.scene.game.events.emit(GAME_EVENTS.HP_CHANGE, hp)` etc. — and `GameCanvas` subscribes via `game.events.on(...)` to update React state. The events are `hp-change`, `player-jump`, `player-land` (defined in `src/game/constants.ts`). Follow this pattern for any new game→UI communication; don't reach into Phaser internals from React or vice versa.

## Conventions

- TypeScript strict mode; PascalCase for classes/components, camelCase for functions/variables, SCREAMING_CASE constants centralized in `src/game/constants.ts`
- Path alias `@` → `src/` (configured in `vite.config.ts` and `tsconfig.json`)
- Styling is Tailwind utility classes with a dark stone theme (`bg-stone-950`); use `cn()` from `src/lib/utils.ts` to merge class names
- `src/components/ui/` contains ~47 generated shadcn/ui components (Radix-based, config in `components.json`). Most are currently unused; treat them as a library — consume them rather than hand-editing them
- **Phaser version is 4** (`phaser@^4.0.0`), imported as `import * as Phaser from 'phaser'`. Don't assume Phaser 3-only APIs
- New game objects that sit "on the ground" should set `depth` to their y coordinate so depth sorting works (see trees and player in `MainScene.ts`)

## Gotchas / Current State

- `@supabase/supabase-js` is in dependencies but no client is instantiated anywhere and there is no `.env` — it's unused scaffolding for now
- HP uses half-heart granularity: `MAX_HP = 6` renders as 3 hearts in the HUD
- Trees are purely visual (no colliders); `takeDamage`/`heal` exist on `Player` but nothing calls them yet
- `package.json` still carries the starter name `vite-react-typescript-starter`; the in-game title comes from `App.tsx`
- The repo is deployed via Bolt.new (`.bolt/config.json`); the build is fully static and client-side
