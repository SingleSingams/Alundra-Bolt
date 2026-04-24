import { cn } from '../lib/utils';

interface HeartProps {
  filled: boolean;
  half?: boolean;
  index: number;
}

function Heart({ filled, half, index }: HeartProps) {
  return (
    <div
      className="relative"
      style={{
        animation: filled ? undefined : undefined,
        transitionDelay: `${index * 40}ms`,
      }}
    >
      <svg
        width="28"
        height="26"
        viewBox="0 0 28 26"
        className={cn(
          'transition-all duration-200 drop-shadow-sm',
          filled ? 'scale-100' : 'scale-90 opacity-40'
        )}
      >
        <defs>
          <linearGradient id={`heart-fill-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={filled ? '#f87171' : '#6b7280'} />
            <stop offset="100%" stopColor={filled ? '#dc2626' : '#4b5563'} />
          </linearGradient>
        </defs>
        <path
          d="M14 23 C14 23 3 15 3 8.5 C3 5.4 5.4 3 8.5 3 C10.24 3 11.91 3.81 13 5.08 C14.09 3.81 15.76 3 17.5 3 C20.6 3 23 5.4 23 8.5 C23 15 14 23 14 23Z"
          fill={`url(#heart-fill-${index})`}
          stroke={filled ? '#b91c1c' : '#374151'}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {filled && (
          <ellipse
            cx="10"
            cy="8"
            rx="2.5"
            ry="1.5"
            fill="rgba(255,255,255,0.35)"
            transform="rotate(-20, 10, 8)"
          />
        )}
        {half && (
          <path
            d="M14 23 C14 23 3 15 3 8.5 C3 5.4 5.4 3 8.5 3 C10.24 3 11.91 3.81 13 5.08 L14 23Z"
            fill={`url(#heart-fill-${index})`}
          />
        )}
      </svg>
    </div>
  );
}

interface ControlBadgeProps {
  keys: string[];
  label: string;
}

function ControlBadge({ keys, label }: ControlBadgeProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {keys.map((k) => (
          <kbd
            key={k}
            className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-stone-800/90 text-stone-200 rounded border border-stone-600 shadow-sm min-w-[20px] text-center leading-4"
          >
            {k}
          </kbd>
        ))}
      </div>
      <span className="text-[11px] text-stone-300 font-medium">{label}</span>
    </div>
  );
}

interface HUDProps {
  hp: number;
  maxHp: number;
  isJumping: boolean;
}

export function HUD({ hp, maxHp, isJumping }: HUDProps) {
  const fullHearts = Math.floor(hp / 2);
  const hasHalf = hp % 2 === 1;
  const totalSlots = Math.ceil(maxHp / 2);

  return (
    <>
      <div className="absolute top-4 left-4 pointer-events-none select-none">
        <div className="bg-stone-900/75 backdrop-blur-sm border border-stone-700/60 rounded-xl px-3 py-2.5 shadow-xl">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
              Life
            </span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: totalSlots }).map((_, i) => {
              const isFull = i < fullHearts;
              const isHalf = i === fullHearts && hasHalf;
              return (
                <Heart
                  key={i}
                  index={i}
                  filled={isFull}
                  half={isHalf}
                />
              );
            })}
          </div>
          <div className="mt-1 text-[9px] text-stone-500 font-mono tracking-wider text-center">
            {hp}/{maxHp}
          </div>
        </div>
      </div>

      {isJumping && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none select-none">
          <div className="bg-sky-900/70 backdrop-blur-sm border border-sky-600/50 rounded-full px-4 py-1 shadow-lg animate-bounce">
            <span className="text-sky-300 text-xs font-bold tracking-wider uppercase">
              Jump!
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 pointer-events-none select-none">
        <div className="bg-stone-900/75 backdrop-blur-sm border border-stone-700/60 rounded-xl px-3 py-2.5 shadow-xl space-y-1.5">
          <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1.5">
            Controls
          </div>
          <ControlBadge keys={['W', 'A', 'S', 'D']} label="Move" />
          <ControlBadge keys={['Z', 'Spc']} label="Jump" />
        </div>
      </div>
    </>
  );
}
