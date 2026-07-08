import { describe, it, expect } from 'vitest';
import { SIDE_QUESTS, SideQuestKind } from '../StoryScript';
import { RESOURCE_NODE_COUNTS, ESSENCE_DROP_CHANCE } from '../constants';
import { ZONE_CONFIGS } from '../ZoneConfigs';

const npcIds = new Set(
  Object.values(ZONE_CONFIGS).flatMap(cfg => cfg.npcs.map(n => n.id)),
);

describe('SIDE_QUESTS definitions', () => {
  it('has a healthy number of quests with unique ids', () => {
    expect(SIDE_QUESTS.length).toBeGreaterThanOrEqual(7);
    const ids = SIDE_QUESTS.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every giver exists as an NPC in some zone', () => {
    for (const quest of SIDE_QUESTS) {
      expect(npcIds.has(quest.giver), `giver ${quest.giver} of ${quest.id}`).toBe(true);
    }
  });

  it('each giver hands out at most one quest (dialog state machine is per NPC)', () => {
    const givers = SIDE_QUESTS.map(q => q.giver);
    expect(new Set(givers).size).toBe(givers.length);
  });

  it('every quest tells its mini-story: offer and done dialogs present', () => {
    for (const quest of SIDE_QUESTS) {
      expect(quest.offerLines.length, quest.id).toBeGreaterThanOrEqual(2);
      expect(quest.doneLines.length, quest.id).toBeGreaterThanOrEqual(2);
      for (const line of [...quest.offerLines, ...quest.doneLines]) {
        expect(line.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('goals and rewards are positive', () => {
    for (const quest of SIDE_QUESTS) {
      expect(quest.goal).toBeGreaterThan(0);
      expect(quest.rewardXp).toBeGreaterThan(0);
      expect(quest.rewardLabel.length).toBeGreaterThan(0);
    }
  });
});

describe('SIDE_QUESTS completability', () => {
  it('talk_npc quests have an existing target with delivery lines', () => {
    for (const quest of SIDE_QUESTS.filter(q => q.kind === 'talk_npc')) {
      expect(quest.targetNpc, quest.id).toBeDefined();
      expect(npcIds.has(quest.targetNpc!), `target ${quest.targetNpc}`).toBe(true);
      expect(quest.targetNpc).not.toBe(quest.giver);
      expect(quest.targetLines?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('gather quests have matching resource sources in the world', () => {
    const totals: Record<string, number> = { herb: 0, wood: 0, stone: 0, ore: 0 };
    for (const counts of Object.values(RESOURCE_NODE_COUNTS)) {
      for (const [kind, count] of Object.entries(counts)) totals[kind] += count ?? 0;
    }
    const sourceByKind: Partial<Record<SideQuestKind, number>> = {
      gather_herb: totals.herb,
      gather_wood: totals.wood,
      gather_ore: totals.ore,
      gather_essence: ESSENCE_DROP_CHANCE > 0 ? Infinity : 0,
    };
    for (const quest of SIDE_QUESTS) {
      const source = sourceByKind[quest.kind];
      if (source === undefined) continue; // kill/talk kinds
      expect(source, `${quest.id} needs ${quest.kind}`).toBeGreaterThan(0);
    }
  });

  it('kill quests are satisfiable by existing enemy spawns', () => {
    const spawns = Object.values(ZONE_CONFIGS).flatMap(cfg => cfg.enemySpawns);
    const dragons = spawns.filter(s => s.type === 'dragon' || s.type === 'dragon-red');
    for (const quest of SIDE_QUESTS) {
      if (quest.kind === 'kill_dragon') expect(dragons.length).toBeGreaterThanOrEqual(quest.goal);
      if (quest.kind === 'kill_any') expect(spawns.length).toBeGreaterThanOrEqual(quest.goal);
    }
  });

  it('quests are woven into the main story (Arthos is remembered)', () => {
    const allText = SIDE_QUESTS.flatMap(q => [...q.offerLines, ...q.doneLines]).join(' ');
    expect(allText).toContain('Arthos');
  });
});
