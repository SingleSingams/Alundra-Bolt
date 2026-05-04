import { VirtualInput } from '../game/VirtualInput';

const BTN = 'w-14 h-14 rounded-full bg-stone-800/60 border border-stone-500/50 flex items-center justify-center text-stone-200 text-lg select-none active:bg-stone-600/80 touch-none';

function DirBtn({ onDown, onUp, label }: { onDown: () => void; onUp: () => void; label: string }) {
  return (
    <button
      className={BTN}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onDown(); }}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

function ActionBtn({
  onDown, onUp, label, color,
}: { onDown: () => void; onUp: () => void; label: string; color: string }) {
  return (
    <button
      className={`${BTN} ${color} w-16 h-16 text-sm font-bold flex-col gap-0.5`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onDown(); }}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="text-base">{label}</span>
    </button>
  );
}

export function TouchControls() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none select-none z-40 flex justify-between px-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {/* D-pad */}
      <div className="pointer-events-auto grid grid-cols-3 gap-1" style={{ width: 176, height: 176 }}>
        <div />
        <DirBtn label="▲" onDown={() => { VirtualInput.up = true; }} onUp={() => { VirtualInput.up = false; }} />
        <div />
        <DirBtn label="◀" onDown={() => { VirtualInput.left = true; }} onUp={() => { VirtualInput.left = false; }} />
        <div className="w-14 h-14 rounded-full bg-stone-900/30 border border-stone-700/30" />
        <DirBtn label="▶" onDown={() => { VirtualInput.right = true; }} onUp={() => { VirtualInput.right = false; }} />
        <div />
        <DirBtn label="▼" onDown={() => { VirtualInput.down = true; }} onUp={() => { VirtualInput.down = false; }} />
        <div />
      </div>

      {/* Action buttons */}
      <div className="pointer-events-auto flex flex-col items-end gap-2 self-end pb-2">
        <div className="flex gap-2">
          <ActionBtn
            label="Y"
            color="border-sky-500/60"
            onDown={() => VirtualInput.pressShoot()}
            onUp={() => VirtualInput.releaseShoot()}
          />
          <ActionBtn
            label="X"
            color="border-red-500/60"
            onDown={() => VirtualInput.pressAttack()}
            onUp={() => VirtualInput.releaseAttack()}
          />
        </div>
        <ActionBtn
          label="Z"
          color="border-amber-500/60"
          onDown={() => VirtualInput.pressJump()}
          onUp={() => VirtualInput.releaseJump()}
        />
      </div>
    </div>
  );
}
