import { describe, it, expect } from 'vitest';
import {
  getStoryStage,
  INTRO_LINES,
  ZONE_ENTRY_BEATS,
  SHIELD_REVELATION,
  STORY_NPC_LINES,
  BOSS_INTRO,
  BOSS_PHASE3_LINE,
  ARTHOS_FAREWELL,
  EPILOGUE,
  EPILOGUE_TITLE,
  GAME_OVER_FLAVOR,
  StoryStage,
} from '../StoryScript';
import { ZONE_CONFIGS } from '../ZoneConfigs';

const VALID_STAGES: StoryStage[] = ['act1', 'act2', 'act3', 'done'];

describe('getStoryStage', () => {
  it('follows the act progression', () => {
    expect(getStoryStage(0, false, false)).toBe('act1');
    expect(getStoryStage(4, false, false)).toBe('act1');
    expect(getStoryStage(5, false, false)).toBe('act2');
    expect(getStoryStage(5, true, false)).toBe('act3');
    expect(getStoryStage(5, true, true)).toBe('done');
  });

  it('shield found implies act3 even mid-kills (out-of-order play)', () => {
    expect(getStoryStage(2, true, false)).toBe('act3');
  });
});

describe('story beats', () => {
  const allBeats = [
    ...Object.values(ZONE_ENTRY_BEATS),
    SHIELD_REVELATION,
    BOSS_INTRO,
    ARTHOS_FAREWELL,
  ];

  it('every beat has a unique id, a speaker and lines', () => {
    const ids = allBeats.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const beat of allBeats) {
      expect(beat.npcName.length).toBeGreaterThan(0);
      expect(beat.lines.length).toBeGreaterThan(0);
      for (const line of beat.lines) expect(line.trim().length).toBeGreaterThan(0);
    }
  });

  it('zone entry beats only reference real zones', () => {
    for (const zone of Object.keys(ZONE_ENTRY_BEATS)) {
      expect(ZONE_CONFIGS).toHaveProperty(zone);
    }
  });

  it('boss room has no separate zone-entry beat (BOSS_INTRO covers it)', () => {
    expect(ZONE_ENTRY_BEATS).not.toHaveProperty('boss_room');
  });
});

describe('STORY_NPC_LINES', () => {
  it('every npc id exists in some zone config', () => {
    const npcIds = new Set(
      Object.values(ZONE_CONFIGS).flatMap(cfg => cfg.npcs.map(n => n.id)),
    );
    for (const npcId of Object.keys(STORY_NPC_LINES)) {
      expect(npcIds.has(npcId)).toBe(true);
    }
  });

  it('only uses valid stages and non-empty lines', () => {
    for (const stages of Object.values(STORY_NPC_LINES)) {
      for (const [stage, lines] of Object.entries(stages)) {
        expect(VALID_STAGES).toContain(stage as StoryStage);
        expect(lines!.length).toBeGreaterThan(0);
      }
    }
  });

  it('mira carries the full arc (act2, act3 confession, done)', () => {
    expect(STORY_NPC_LINES.mira?.act2).toBeDefined();
    expect(STORY_NPC_LINES.mira?.act3).toBeDefined();
    expect(STORY_NPC_LINES.mira?.done).toBeDefined();
    // the confession names her brother
    expect(STORY_NPC_LINES.mira!.act3!.join(' ')).toContain('Arthos');
  });
});

describe('narrative coherence', () => {
  it('the shield revelation names Arthos before the boss recognizes it', () => {
    expect(SHIELD_REVELATION.lines.join(' ')).toContain('Arthos');
    expect(BOSS_INTRO.lines.join(' ')).toContain('Schild');
  });

  it('the farewell resolves the song motif planted in the forest', () => {
    expect(ARTHOS_FAREWELL.lines.join(' ')).toContain('Lied');
    expect(BOSS_PHASE3_LINE).toContain('Lied');
  });

  it('intro and epilogue are present and substantial', () => {
    expect(INTRO_LINES.length).toBeGreaterThanOrEqual(4);
    expect(EPILOGUE.length).toBeGreaterThanOrEqual(3);
    expect(EPILOGUE_TITLE.length).toBeGreaterThan(0);
    expect(GAME_OVER_FLAVOR.length).toBeGreaterThan(0);
  });
});
