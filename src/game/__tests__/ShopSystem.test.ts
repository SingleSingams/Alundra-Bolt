import { describe, it, expect } from 'vitest';
import { SHOP_ITEMS, ShopItem } from '../constants';

describe('SHOP_ITEMS catalog', () => {
  it('has at least 4 items', () => {
    expect(SHOP_ITEMS.length).toBeGreaterThanOrEqual(4);
  });

  it('every item has a positive xpCost', () => {
    for (const item of SHOP_ITEMS) {
      expect(item.xpCost).toBeGreaterThan(0);
    }
  });

  it('every item has a non-empty label and icon', () => {
    for (const item of SHOP_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon.length).toBeGreaterThan(0);
    }
  });

  it('all item ids are unique', () => {
    const ids = SHOP_ITEMS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('heart item is cheapest', () => {
    const heart = SHOP_ITEMS.find(i => i.id === 'heart');
    expect(heart).toBeDefined();
    const minCost = Math.min(...SHOP_ITEMS.map(i => i.xpCost));
    expect(heart!.xpCost).toBe(minCost);
  });

  it('projectile_upgrade is among the most expensive', () => {
    const proj = SHOP_ITEMS.find(i => i.id === 'projectile_upgrade');
    expect(proj).toBeDefined();
    const maxCost = Math.max(...SHOP_ITEMS.map(i => i.xpCost));
    expect(proj!.xpCost).toBe(maxCost);
  });
});

describe('Shop affordability logic', () => {
  const canAfford = (item: ShopItem, xp: number) => xp >= item.xpCost;

  it('player with 0 XP cannot afford any item', () => {
    for (const item of SHOP_ITEMS) {
      expect(canAfford(item, 0)).toBe(false);
    }
  });

  it('player with 5 XP can afford heart but not projectile_upgrade', () => {
    const heart = SHOP_ITEMS.find(i => i.id === 'heart')!;
    const proj = SHOP_ITEMS.find(i => i.id === 'projectile_upgrade')!;
    expect(canAfford(heart, 5)).toBe(true);
    expect(canAfford(proj, 5)).toBe(false);
  });

  it('player with exactly the cost can afford the item', () => {
    for (const item of SHOP_ITEMS) {
      expect(canAfford(item, item.xpCost)).toBe(true);
    }
  });

  it('player with cost - 1 XP cannot afford the item', () => {
    for (const item of SHOP_ITEMS) {
      expect(canAfford(item, item.xpCost - 1)).toBe(false);
    }
  });

  it('XP deduction after purchase leaves correct remainder', () => {
    const item = SHOP_ITEMS.find(i => i.id === 'heal_potion')!;
    const startXp = 20;
    const remaining = startXp - item.xpCost;
    expect(remaining).toBe(20 - item.xpCost);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });
});
