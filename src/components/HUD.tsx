import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import {
  InventoryItem,
  MAX_INVENTORY,
  ZoneId,
  ZONES,
  ZONE_ORDER,
} from '../game/constants';
import { MapPin } from 'lucide-react';

type HeartAnimState = 'damage' | 'heal' | null;

interface HeartProps {
  filled: boolean;
  half?: boolean;
  index: number;
  animState: HeartAnimState;
}

function Heart({ filled, half, index, animState }: HeartProps) {
  return (
    <div
      className={cn(
        'relative',
        animState === 'damage' && 'heart-shake',
        animState === 'heal' && 'heart-bounce'
      )}
      style={{ transitionDelay: `${index * 40}ms` }}
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

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow">
      <defs>
        <linearGradient id="inv-heart" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <path
        d="M12 21 C12 21 3 14 3 8 C3 5.2 5.2 3 8 3 C9.7 3 11.2 3.9 12 5.2 C12.8 3.9 14.3 3 16 3 C18.8 3 21 5.2 21 8 C21 14 12 21 12 21Z"
        fill="url(#inv-heart)"
        stroke="#7f1d1d"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <ellipse
        cx="8.5"
        cy="7.5"
        rx="1.8"
        ry="1"
        fill="rgba(255,255,255,0.45)"
        transform="rotate(-20, 8.5, 7.5)"
      />
    </svg>
  );
}

function SwordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow">
      <defs>
        <linearGradient id="inv-blade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="50%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
      </defs>
      <polygon
        points="17,3 21,3 21,7 8,20 5,20 5,17"
        fill="url(#inv-blade)"
        stroke="#4b5563"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <rect x="3.5" y="15" width="6" height="2" transform="rotate(-45, 6.5, 16)"
        fill="#78350f" stroke="#451a03" strokeWidth="0.6" />
      <rect x="2" y="19" width="4" height="2" transform="rotate(-45, 4, 20)"
        fill="#1e293b" stroke="#0f172a" strokeWidth="0.6" />
      <circle cx="3" cy="21" r="1.3" fill="#eab308" stroke="#854d0e" strokeWidth="0.5" />
    </svg>
  );
}

function PotionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow">
      <rect x="10" y="4" width="4" height="5" fill="#166534" rx="1" />
      <rect x="9" y="3" width="6" height="3" fill="#92400e" rx="1" />
      <ellipse cx="12" cy="16" rx="6" ry="6" fill="#16a34a" />
      <ellipse cx="12" cy="15" rx="4" ry="4" fill="#4ade80" />
      <ellipse cx="10.5" cy="13" rx="1.5" ry="1" fill="#bbf7d0" opacity="0.7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow">
      <path
        d="M12 3 L20 6 L20 13 C20 17.5 16 21 12 22 C8 21 4 17.5 4 13 L4 6 Z"
        fill="#1d4ed8"
        stroke="#1e40af"
        strokeWidth="1"
      />
      <path
        d="M12 5 L18 7.5 L18 13 C18 16.5 15 19.5 12 20.5 C9 19.5 6 16.5 6 13 L6 7.5 Z"
        fill="#3b82f6"
      />
      <path d="M12 8 L12 17 M9 12.5 L15 12.5" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface InventorySlotProps {
  item?: InventoryItem;
  index: number;
}

function InventorySlot({ item, index }: InventorySlotProps) {
  const hasItem = !!item;
  return (
    <div
      className={cn(
        'relative w-9 h-9 rounded-md border flex items-center justify-center transition-all duration-200',
        hasItem
          ? 'bg-stone-800/80 border-amber-600/60 shadow-[0_0_8px_rgba(217,119,6,0.25)]'
          : 'bg-stone-900/60 border-stone-700/50 border-dashed'
      )}
      style={{ transitionDelay: `${index * 30}ms` }}
    >
      {hasItem ? (
        <div className="animate-in fade-in zoom-in duration-200">
          {item === 'heart' ? <HeartIcon /> :
           item === 'potion' ? <PotionIcon /> :
           item === 'shield_fragment' ? <ShieldIcon /> :
           <SwordIcon />}
        </div>
      ) : (
        <span className="text-[9px] text-stone-600 font-mono font-bold">{index + 1}</span>
      )}
    </div>
  );
}

interface InventoryBarProps {
  inventory: InventoryItem[];
}

function InventoryBar({ inventory }: InventoryBarProps) {
  const slots: (InventoryItem | undefined)[] = [];
  for (let i = 0; i < MAX_INVENTORY; i++) {
    slots.push(inventory[i]);
  }

  return (
    <div className="absolute top-4 right-4 pointer-events-none select-none">
      <div className="bg-stone-900/75 backdrop-blur-sm border border-stone-700/60 rounded-xl px-3 py-2.5 shadow-xl">
        <div className="flex items-center gap-1 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
            Inventory
          </span>
        </div>
        <div className="flex gap-1.5">
          {slots.map((item, i) => (
            <InventorySlot key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface MinimapProps {
  zone: ZoneId;
}

function Minimap({ zone }: MinimapProps) {
  const zoneMeta = ZONES[zone];
  const currentIndex = ZONE_ORDER.indexOf(zone);

  return (
    <div className="absolute bottom-4 left-4 pointer-events-none select-none">
      <div className="bg-stone-900/75 backdrop-blur-sm border border-stone-700/60 rounded-xl px-3 py-2.5 shadow-xl min-w-[168px]">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
            Region
          </span>
        </div>
        <div
          key={zone}
          className="text-amber-100 font-semibold text-sm leading-tight mb-2.5 animate-in fade-in slide-in-from-left-1 duration-300"
        >
          {zoneMeta.name}
        </div>
        <div className="flex items-center gap-1.5">
          {ZONE_ORDER.map((z, i) => {
            const active = z === zone;
            const visited = i <= currentIndex;
            return (
              <div key={z} className="flex items-center gap-1.5">
                <div className="relative">
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-all duration-300',
                      active
                        ? 'bg-amber-400 scale-125 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                        : visited
                        ? 'bg-amber-700/70'
                        : 'bg-stone-600/70'
                    )}
                  />
                  {active && (
                    <div className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
                  )}
                </div>
                {i < ZONE_ORDER.length - 1 && (
                  <div
                    className={cn(
                      'h-px w-6 transition-colors duration-300',
                      i < currentIndex ? 'bg-amber-700/60' : 'bg-stone-700/60'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface HUDProps {
  hp: number;
  maxHp: number;
  isJumping: boolean;
  inventory: InventoryItem[];
  zone: ZoneId;
}

export function HUD({ hp, maxHp, isJumping, inventory, zone }: HUDProps) {
  const fullHearts = Math.floor(hp / 2);
  const hasHalf = hp % 2 === 1;
  const totalSlots = Math.ceil(maxHp / 2);
  const prevHpRef = useRef(hp);
  const [heartAnim, setHeartAnim] = useState<HeartAnimState>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevHpRef.current;
    if (hp === prev) return;

    if (animTimerRef.current) clearTimeout(animTimerRef.current);

    setHeartAnim(hp < prev ? 'damage' : 'heal');
    animTimerRef.current = setTimeout(() => {
      setHeartAnim(null);
    }, hp < prev ? 380 : 280);

    prevHpRef.current = hp;
  }, [hp]);

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
                  animState={heartAnim}
                />
              );
            })}
          </div>
          <div className="mt-1 text-[9px] text-stone-500 font-mono tracking-wider text-center">
            {hp}/{maxHp}
          </div>
        </div>
      </div>

      <InventoryBar inventory={inventory} />

      <Minimap zone={zone} />

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
          <ControlBadge keys={['Z', 'Spc']} label="Jump / Open" />
          <ControlBadge keys={['X']} label="Attack" />
          <ControlBadge keys={['Y']} label="Ranged" />
        </div>
      </div>
    </>
  );
}
