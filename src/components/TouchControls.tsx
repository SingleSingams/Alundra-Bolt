import { VirtualInput } from '../game/VirtualInput';

const DIR_BTN = [
  'rounded-full bg-stone-800/70 border border-stone-500/50 flex items-center justify-center',
  'text-stone-200 text-xs font-bold select-none active:bg-stone-600/80 touch-none',
].join(' ');

const ACT_BTN = [
  'rounded-full bg-stone-800/70 border flex items-center justify-center',
  'text-stone-200 text-xs font-bold select-none active:bg-stone-600/80 touch-none',
].join(' ');

function DirBtn({ onDown, onUp, label, style }: { onDown: () => void; onUp: () => void; label: string; style?: React.CSSProperties }) {
  return (
    <button
      className={DIR_BTN}
      style={{ width: 44, height: 44, ...style }}
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

export function TouchControls() {
  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-40"
      style={{ touchAction: 'none' }}
    >
      {/* D-pad — bottom left */}
      <div
        className="absolute pointer-events-auto"
        style={{
          left: 'max(1rem, env(safe-area-inset-left))',
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', gridTemplateRows: 'repeat(3, 44px)', gap: 4 }}>
          <div />
          <DirBtn label="▲" onDown={() => { VirtualInput.up = true; }} onUp={() => { VirtualInput.up = false; }} />
          <div />
          <DirBtn label="◀" onDown={() => { VirtualInput.left = true; }} onUp={() => { VirtualInput.left = false; }} />
          <div
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(28,25,23,0.3)', border: '1px solid rgba(120,113,108,0.3)' }}
          />
          <DirBtn label="▶" onDown={() => { VirtualInput.right = true; }} onUp={() => { VirtualInput.right = false; }} />
          <div />
          <DirBtn label="▼" onDown={() => { VirtualInput.down = true; }} onUp={() => { VirtualInput.down = false; }} />
          <div />
        </div>
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
