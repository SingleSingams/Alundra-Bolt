import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualInput } from '../VirtualInput';

function resetVirtualInput() {
  VirtualInput.up    = false;
  VirtualInput.down  = false;
  VirtualInput.left  = false;
  VirtualInput.right = false;
  VirtualInput.releaseJump();
  VirtualInput.releaseAttack();
  VirtualInput.releaseShoot();
  VirtualInput.endFrame(); // sync prev → current (all false)
}

describe('VirtualInput', () => {
  beforeEach(resetVirtualInput);

  describe('directional flags', () => {
    it('all start as false', () => {
      expect(VirtualInput.up).toBe(false);
      expect(VirtualInput.down).toBe(false);
      expect(VirtualInput.left).toBe(false);
      expect(VirtualInput.right).toBe(false);
    });

    it('can be set and cleared', () => {
      VirtualInput.up = true;
      expect(VirtualInput.up).toBe(true);
      VirtualInput.up = false;
      expect(VirtualInput.up).toBe(false);
    });
  });

  describe('jump JustDown', () => {
    it('returns false when not pressed', () => {
      expect(VirtualInput.isJumpJustDown()).toBe(false);
    });

    it('returns true on first frame after press', () => {
      VirtualInput.pressJump();
      expect(VirtualInput.isJumpJustDown()).toBe(true);
    });

    it('returns false on second frame while still held', () => {
      VirtualInput.pressJump();
      VirtualInput.endFrame();
      expect(VirtualInput.isJumpJustDown()).toBe(false);
    });

    it('returns false after release and endFrame', () => {
      VirtualInput.pressJump();
      VirtualInput.endFrame();
      VirtualInput.releaseJump();
      VirtualInput.endFrame();
      expect(VirtualInput.isJumpJustDown()).toBe(false);
    });

    it('re-triggers on a new press after release', () => {
      VirtualInput.pressJump();
      VirtualInput.endFrame();
      VirtualInput.releaseJump();
      VirtualInput.endFrame();
      VirtualInput.pressJump();
      expect(VirtualInput.isJumpJustDown()).toBe(true);
    });
  });

  describe('attack JustDown', () => {
    it('triggers only on the press frame', () => {
      VirtualInput.pressAttack();
      expect(VirtualInput.isAttackJustDown()).toBe(true);
      VirtualInput.endFrame();
      expect(VirtualInput.isAttackJustDown()).toBe(false);
    });
  });

  describe('shoot JustDown', () => {
    it('triggers only on the press frame', () => {
      VirtualInput.pressShoot();
      expect(VirtualInput.isShootJustDown()).toBe(true);
      VirtualInput.endFrame();
      expect(VirtualInput.isShootJustDown()).toBe(false);
    });
  });

  describe('independent buttons', () => {
    it('jump and attack do not interfere', () => {
      VirtualInput.pressJump();
      VirtualInput.pressAttack();
      expect(VirtualInput.isJumpJustDown()).toBe(true);
      expect(VirtualInput.isAttackJustDown()).toBe(true);
      VirtualInput.endFrame();
      expect(VirtualInput.isJumpJustDown()).toBe(false);
      expect(VirtualInput.isAttackJustDown()).toBe(false);
    });
  });
});
