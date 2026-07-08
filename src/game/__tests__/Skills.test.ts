import { describe, it, expect } from 'vitest';
import {
  SKILL_DESCRIPTIONS,
  LevelUpSkill,
  SKILL_SYNERGIES,
} from '../constants';

const ALL_SKILLS: LevelUpSkill[] = [
  'hp_up', 'attack_up', 'shield', 'xp_boost', 'speed_up',
  'double_shot', 'vampire', 'dash',
];

describe('SKILL_DESCRIPTIONS', () => {
  it('has an entry for every LevelUpSkill', () => {
    for (const skill of ALL_SKILLS) {
      expect(SKILL_DESCRIPTIONS[skill]).toBeDefined();
      expect(SKILL_DESCRIPTIONS[skill].length).toBeGreaterThan(0);
    }
  });

  it('new skills have descriptions', () => {
    expect(SKILL_DESCRIPTIONS['double_shot']).toBeDefined();
    expect(SKILL_DESCRIPTIONS['vampire']).toBeDefined();
    expect(SKILL_DESCRIPTIONS['dash']).toBeDefined();
  });
});

describe('SKILL_SYNERGIES structure', () => {
  it('every synergy has requires, label, and desc', () => {
    for (const syn of SKILL_SYNERGIES) {
      expect(syn.requires.length).toBeGreaterThan(0);
      expect(syn.label.length).toBeGreaterThan(0);
      expect(syn.desc.length).toBeGreaterThan(0);
    }
  });

  it('all required skills in synergies are valid LevelUpSkill values', () => {
    const valid = new Set<string>(ALL_SKILLS);
    for (const syn of SKILL_SYNERGIES) {
      for (const req of syn.requires) {
        expect(valid.has(req)).toBe(true);
      }
    }
  });

  it('has at least 5 synergies after new additions', () => {
    expect(SKILL_SYNERGIES.length).toBeGreaterThanOrEqual(5);
  });

  it('Sturmschütze synergy requires double_shot and attack_up', () => {
    const syn = SKILL_SYNERGIES.find(s => s.label === 'Sturmschütze');
    expect(syn).toBeDefined();
    expect(syn!.requires).toContain('double_shot');
    expect(syn!.requires).toContain('attack_up');
  });

  it('Lebenshunger synergy requires vampire and hp_up', () => {
    const syn = SKILL_SYNERGIES.find(s => s.label === 'Lebenshunger');
    expect(syn).toBeDefined();
    expect(syn!.requires).toContain('vampire');
    expect(syn!.requires).toContain('hp_up');
  });
});
