# Verdant Chronicles

Ein 2D-Abenteuer-RPG für den Mobilbrowser – entwickelt mit React, TypeScript, Phaser 4 und Tailwind CSS.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-g5h8k3wp)

---

## Spielprinzip

Erkunde fünf Zonen (Grasland → Wald → Verlies-Eingang → Verlies-Inneres → Bosskammer), besiege Feinde, sammle Items und level auf, bevor du dem **Leere-Tyrannen** gegenübertrittst.

### Steuerung

| Aktion | Tastatur | Touch |
|---|---|---|
| Bewegen | W / A / S / D | Virtueller Joystick (links) |
| Springen / Öffnen | Z / Leertaste | Z-Taste (rechts) |
| Nahkampfangriff | X | X-Taste (rechts) |
| Fernkampf | Y | Y-Taste (rechts) |
| Trank benutzen | E | Trank-Slot antippen |
| Pause | ESC / P | – |
| Vollbild | F | Pause-Menü → Vollbild |

---

## Setup

```bash
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm run build      # Produktions-Build nach dist/
npm run typecheck  # TypeScript-Prüfung
npm test           # Vitest-Tests
```

---

## Supabase-Bestenliste (optional)

Das Spiel kann Spielstände in einer Supabase-Datenbank speichern. Ohne Konfiguration läuft das Spiel vollständig offline.

### 1. Projekt anlegen

Erstelle ein kostenloses Projekt auf [supabase.com](https://supabase.com).

### 2. Tabelle anlegen

Im Supabase SQL-Editor ausführen:

```sql
create table scores (
  id bigserial primary key,
  name text not null check (char_length(name) between 1 and 10),
  level int not null,
  xp int not null,
  zone text not null,
  created_at timestamptz default now()
);
alter table scores enable row level security;
create policy "anon insert" on scores for insert to anon with check (true);
create policy "anon select" on scores for select to anon using (true);
```

### 3. Umgebungsvariablen setzen

Erstelle eine `.env`-Datei im Projektverzeichnis:

```
VITE_SUPABASE_URL=https://<dein-projekt>.supabase.co
VITE_SUPABASE_ANON_KEY=<dein-anon-key>
```

---

## Technologie-Stack

| Bereich | Technologie |
|---|---|
| UI-Framework | React 18 + TypeScript |
| Spiel-Engine | Phaser 4 |
| Styling | Tailwind CSS 3 |
| Build-Tool | Vite 5 |
| Tests | Vitest |
| Datenbank | Supabase (optional) |
| Speicherung | localStorage |

---

## Projektstruktur

```
src/
├── components/       # React-Overlay (HUD, Dialoge, Menüs)
│   ├── GameCanvas.tsx
│   ├── HUD.tsx
│   ├── DialogBox.tsx
│   ├── MainMenuScreen.tsx
│   ├── PauseMenu.tsx
│   ├── SkillChoiceScreen.tsx
│   └── ...
├── game/             # Phaser-Spiellogik
│   ├── MainScene.ts  # Hauptszene (Zonen, Feinde, Items)
│   ├── Player.ts
│   ├── Enemy.ts      # basic | ranger | shielder | speedrunner
│   ├── Boss.ts
│   ├── Projectile.ts
│   ├── Item.ts
│   ├── SaveSystem.ts
│   ├── SoundSystem.ts
│   └── constants.ts
└── lib/
    └── scores.ts     # Supabase-Integration
```

---

## Features

- 5 Spielzonen mit je eigenen Feinden und Umgebungsgefahren
- 4 Gegnertypen: Basis, Schütze, Schildträger, Schnellläufer
- Bosskampf mit 2 Phasen und Projektil-Fächerangriff
- Level-Up-System mit Skill-Auswahl (HP, Angriff, Schild, Tempo, XP)
- Trank-System, Schild-System, Projektil-Upgrades
- Minimap mit Fog-of-War
- Touch-Steuerung für Mobile-Browser
- Vollbild-Unterstützung
- Persistenter Spielstand (localStorage)
- Bestenliste (Supabase, optional)

---

v0.1.0
