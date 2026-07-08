import { useRef, useState, useCallback } from 'react';
import { VirtualInput } from '../game/VirtualInput';

// ─── Virtual Joystick ────────────────────────────────────────────────────────

const BASE_R = 52;   // outer ring radius (px)
const KNOB_R = 22;   // knob radius (px)
const MAX_DIST = 38; // max knob travel from center
const DEAD = 10;     // dead-zone radius

function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const activePtr = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const getCenter = () => {
    const r = baseRef.current!.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };

  const applyKnob = useCallback((dx: number, dy: number) => {
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, MAX_DIST);
    const ratio = dist > 0 ? clamped / dist : 0;
    const nx = dx * ratio;
    const ny = dy * ratio;
    setKnob({ x: nx, y: ny });

    VirtualInput.right = nx >  DEAD;
    VirtualInput.left  = nx < -DEAD;
    VirtualInput.down  = ny >  DEAD;
    VirtualInput.up    = ny < -DEAD;
  }, []);

  const resetKnob = useCallback(() => {
    setKnob({ x: 0, y: 0 });
    VirtualInput.right = false;
    VirtualInput.left  = false;
    VirtualInput.up    = false;
    VirtualInput.down  = false;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (activePtr.current !== null) return;
    activePtr.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { cx, cy } = getCenter();
    applyKnob(e.clientX - cx, e.clientY - cy);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerId !== activePtr.current) return;
    const { cx, cy } = getCenter();
    applyKnob(e.clientX - cx, e.clientY - cy);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== activePtr.current) return;
    activePtr.current = null;
    resetKnob();
  };

  const D = BASE_R * 2;

  return (
    <div
      ref={baseRef}
      style={{
        width: D,
        height: D,
        borderRadius: '50%',
        background: 'rgba(28,25,23,0.45)',
        border: '2px solid rgba(120,113,108,0.45)',
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* knob */}
      <div
        style={{
          position: 'absolute',
          width: KNOB_R * 2,
          height: KNOB_R * 2,
          borderRadius: '50%',
          background: 'rgba(168,162,158,0.80)',
          border: '2px solid rgba(214,211,209,0.60)',
          top: BASE_R - KNOB_R + knob.y,
          left: BASE_R - KNOB_R + knob.x,
          pointerEvents: 'none',
          transition: activePtr.current === null ? 'top 0.08s,left 0.08s' : undefined,
        }}
      />
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

const ACT_BTN = [
  'rounded-full bg-stone-800/70 border flex items-center justify-center',
  'text-stone-200 text-xs font-bold select-none active:bg-stone-600/80 touch-none',
].join(' ');

function ActionBtn({
  onDown, onUp, label, borderColor,
}: { onDown: () => void; onUp: () => void; label: string; borderColor: string }) {
  return (
    <button
      className={ACT_BTN}
      style={{ width: 52, height: 52, borderColor }}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); onDown(); }}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export function TouchControls() {
  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-40"
      style={{ touchAction: 'none' }}
    >
      {/* Joystick — bottom left */}
      <div
        className="absolute pointer-events-auto"
        style={{
          left: 'max(1rem, env(safe-area-inset-left))',
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <Joystick />
      </div>

      {/* Action buttons — bottom right */}
      <div
        className="absolute pointer-events-auto flex flex-col items-end gap-2"
        style={{
          right: 'max(1rem, env(safe-area-inset-right))',
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex gap-2">
          <ActionBtn label="Y" borderColor="rgba(56,189,248,0.6)" onDown={() => VirtualInput.pressShoot()} onUp={() => VirtualInput.releaseShoot()} />
          <ActionBtn label="X" borderColor="rgba(239,68,68,0.6)" onDown={() => VirtualInput.pressAttack()} onUp={() => VirtualInput.releaseAttack()} />
        </div>
        <ActionBtn label="Z" borderColor="rgba(217,119,6,0.6)" onDown={() => VirtualInput.pressJump()} onUp={() => VirtualInput.releaseJump()} />
      </div>
    </div>
  );
}
