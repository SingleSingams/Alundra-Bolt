# CLAUDE.md

Guidance for AI assistants working in this repository.

## Project Overview

"Verdant Chronicles" — a 2D top-down action-adventure game (Alundra/Zelda-like) built with React 18 + TypeScript and the Phaser 4 game engine, bundled by Vite. The player is a knight fighting through 5 zones (village → forest → dungeon → dungeon interior → boss room) with combat, XP/skills, quests, crafting, shops, and a 3-slot save system. UI text is German.

## Commands

- `npm run dev` — Vite dev server (http://localhost:5173)
- `npm run build` — type-check (`tsc -b`) then `vite build` to `dist/`
- `npm test` / `npx vitest run` — Vitest suite (`src/game/__tests__/`)
- `npm run typecheck` — `tsc --noEmit -p tsconfig.app.json`
- `npm run lint` — ESLint (has pre-existing errors; CI does **not** run lint)

CI (`.github/workflows/ci.yml`) runs typecheck → test → build. Keep all three green.

## Architecture

Two sides with a narrow event-bus bridge:

**React side (`src/components/`):** `GameCanvas.tsx` owns the `Phaser.Game` in a ref and is the single Phaser↔React bridge: it subscribes to every `GAME_EVENTS` key on `game.events` and mirrors payloads into React state; UI actions emit events back (e.g. `SHOP_BUY`, `CRAFT`, `DIALOG_CLOSE`). Screens: `MainMenuScreen` (save slots), `HUD` (hearts, XP, minimap, quest log, materials), `DialogBox` (typewriter + portraits), `ShopScreen`, `CraftingScreen`, `SkillChoiceScreen`, `PauseMenu`, `GameOverScreen`, `VictoryScreen`, `TouchControls`. In dev builds `window.__game` exposes the Phaser instance for debugging/E2E.

**Phaser side (`src/game/`):**
- `LoadingScene.ts` — loads all PNGs from `public/assets/` (256px-frame spritesheets for knight/NPCs/enemies, images for buildings/decor) and defines animations
- `MainScene.ts` — the one gameplay scene: zone loading, combat wiring, XP/levels/skills, main quest + side quests, materials/crafting handlers, save/load orchestration
- `ZoneConfigs.ts` — data for all 5 zones (enemy/NPC/hazard/secret/transition layouts)
- `WorldBuilder.ts` — procedural placement: trees, village + stamped dirt paths, decorations with soft shadows, campfires, hazards
- `Player.ts`, `Enemy.ts`, `Boss.ts`, `Projectile.ts`, `NPC.ts`, `Item.ts`, `ResourceNode.ts` — actors (Containers with Arcade bodies)
- `AtmosphereSystem.ts` — HD-2.5D look: camera filters (tilt-shift + vignette via Phaser 4 `camera.filters.external`), per-zone color-grade overlay, screen-space ambient particles, light halos. **Skips filters/particles on software WebGL** (SwiftShader detection) to avoid slideshow FPS
- `TextureFactory.ts` — runtime-generated textures (organic grass tileset at 2x, soft radial shadows, path stamps, ground-detail overlay, ore nodes, particles)
- `InteractionManager.ts` — proximity prompts + interactions for NPCs, chests, resource nodes
- `SaveSystem.ts` (3 localStorage slots), `SoundSystem.ts` (procedural audio), `SettingsSystem.ts`, `JuiceHelper.ts` (particles/damage numbers/freeze frames), `HapticSystem.ts`, `VirtualInput.ts`
- `StoryScript.ts` — the complete narrative ("Das Lied von Aelindra"): intro, one-time zone-entry beats, stage-dependent NPC dialog overrides, boss intro/phase-3/farewell lines, epilogue. Story stage (`act1/act2/act3/done`) derives from main-quest flags via `getStoryStage`
- `constants.ts` — single source for tunables, `GAME_EVENTS` names, shop items, skills/synergies, **`MATERIALS`/`RECIPES`/`RESOURCE_NODE_COUNTS`** (crafting), **`SIDE_QUESTS`**, zone metadata, loot tables

**The bridge contract:** game code emits on `this.game.events` with names from `GAME_EVENTS`; React never reaches into Phaser internals and vice versa. Add new events to `GAME_EVENTS` in `constants.ts` and register/unregister them in `GameCanvas.tsx`.

## Key systems

- **Rendering is HD, not pixel art**: assets are 256–1024px illustrations; `GameConfig.ts` sets `pixelArt: false, antialias: true`. Do not re-enable nearest-neighbor filtering. Sprite scales (e.g. `KNIGHT_SCALE` 0.26, `ENEMY_SPRITE_SCALE` 0.145) are tuned to keep detail — avoid extreme downscaling.
- **Crafting**: gather wood/stone/herb/ore from `ResourceNode`s (Z/Space nearby; they respawn), essence drops from kills. Elara (alchemy) and Torvin (forge) are crafter NPCs (`NPCDefinition.station`); `MainScene.handleCraft` consumes materials and applies `Recipe.output`.
- **Quests**: linear main quest (kill 5 → find shield → beat boss) tracked in `MainScene` fields; side quests (`SIDE_QUESTS`) activate on first talk to their giver NPC and progress via herb gathering / dragon kills. HUD shows both.
- **Story**: all narrative text lives in `StoryScript.ts` — never hardcode dialog elsewhere. The hero is named Kael; the twist is that the Void Tyrant is Arthos, Mira's brother and the village's first hero. One-time beats are persisted in `SaveData.seenStoryBeats`; NPC dialogs upgrade per stage via `STORY_NPC_LINES` (fallback: `ZoneConfigs` lines). After the boss dies, `pendingVictory` delays the victory screen until Arthos' farewell dialog is closed. Keep new content consistent with this arc (foreshadowing: Lina's song, the humming tyrant, the cradled shield).
- **Depth sorting**: ground objects set `depth` to their y coordinate (re-applied each update for movers).
- **Dialog close**: closing a dialog sets a 300ms `interactCooldown` on the player so the same Z/Space keypress can't instantly reopen the next dialog.

## Conventions

- TypeScript strict; PascalCase classes/components, camelCase functions, SCREAMING_CASE constants centralized in `src/game/constants.ts`
- Path alias `@` → `src/`; Tailwind with dark stone theme; `cn()` from `src/lib/utils.ts`
- `src/components/ui/` is a generated shadcn/ui library — consume, don't hand-edit
- **Phaser version is 4** (`phaser@^4.0.0`). APIs differ from Phaser 3: e.g. post-effects are `camera.filters.internal/external` (FilterList), not `postFX`
- New save fields: extend `SaveData` + `defaults` + `parseSlot` in `SaveSystem.ts` (defaulting parser keeps old saves compatible), and update `VictoryScreen.tsx`'s NG+ reset object
- Tests live in `src/game/__tests__/` and mostly validate data/config invariants — add matching tests when adding recipes, quests, zones, or skills

## Gotchas

- `@supabase/supabase-js` is installed but unused (only `src/lib/scores.ts` scaffolding); no `.env` needed
- HP uses half-heart granularity (`MAX_HP = 6` = 3 hearts)
- Headless/VM environments run WebGL via SwiftShader: expect very low FPS; `AtmosphereSystem.isSoftwareRenderer()` disables the expensive effects there. For Playwright E2E, drive UI via the dialog buttons (label cycles Überspringen → Weiter → Schließen) and use `window.__game.events.emit(...)` for deterministic testing
- Deployment is fully static (Bolt.new / Netlify, `netlify.toml`); `package.json` still carries the starter name
