import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import {
  InventoryItem,
  MAX_INVENTORY,
  ZoneId,
  ZONES,
  MinimapData,
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

function ProjectileUpgradeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow">
      <circle cx="12" cy="12" r="7" fill="#fbbf24" opacity="0.4" />
      <circle cx="12" cy="12" r="4" fill="#fef3c7" />
      <circle cx="12" cy="12" r="2.5" fill="#fde68a" />
      <line x1="5" y1="5" x2="9" y2="9" stroke="#fbbf24" strokeWidth="1.5" />
      <line x1="19" y1="5" x2="15" y2="9" stroke="#fbbf24" strokeWidth="1.5" />
      <line x1="12" y1="3" x2="12" y2="7" stroke="#fbbf24" strokeWidth="1.5" />
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
  onUsePotion?: () => void;
}

function InventorySlot({ item, index, onUsePotion }: InventorySlotProps) {
  const hasItem = !!item;
  const isPotion = item === 'potion';

  return (
    <div
      onClick={isPotion ? onUsePotion : undefined}
      className={cn(
        'relative rounded-md border flex items-center justify-center transition-all duration-200',
        'w-11 h-11',
        hasItem
          ? isPotion
            ? 'bg-emerald-900/80 border-emerald-400/70 shadow-[0_0_12px_rgba(74,222,128,0.45)] cursor-pointer active:scale-90'
            : 'bg-stone-800/80 border-amber-600/60 shadow-[0_0_8px_rgba(217,119,6,0.25)]'
          : 'bg-stone-900/60 border-stone-700/50 border-dashed'
      )}
      style={{ transitionDelay: `${index * 30}ms` }}
    >
      {hasItem ? (
        <div className="animate-in fade-in zoom-in duration-200">
          {item === 'heart' ? <HeartIcon /> :
           item === 'potion' ? <PotionIcon /> :
           item === 'shield_fragment' ? <ShieldIcon /> :
           item === 'projectile_upgrade' ? <ProjectileUpgradeIcon /> :
           <SwordIcon />}
        </div>
      ) : (
        <span className="text-[9px] text-stone-600 font-mono font-bold">{index + 1}</span>
      )}
      {isPotion && (
        <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[8px] text-emerald-400 font-mono font-bold whitespace-nowrap">
          E / Tap
        </span>
      )}
    </div>
  );
}

interface InventoryBarProps {
  inventory: InventoryItem[];
  onUsePotion?: () => void;
}

function InventoryBar({ inventory, onUsePotion }: InventoryBarProps) {
  const slots: (InventoryItem | undefined)[] = [];
  for (let i = 0; i < MAX_INVENTORY; i++) {
    slots.push(inventory[i]);
  }

  return (
    <div className="absolute top-4 right-4 select-none" style={{ pointerEvents: 'auto' }}>
      <div className="bg-stone-900/75 backdrop-blur-sm border border-stone-700/60 rounded-xl px-3 py-2.5 shadow-xl">
        <div className="flex items-center gap-1 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
            Rucksack
          </span>
        </div>
        <div className="flex gap-1.5 pb-3">
          {slots.map((item, i) => (
            <InventorySlot key={i} item={item} index={i} onUsePotion={item === 'potion' ? onUsePotion : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}

const CANVAS_PX = 100;

const MINIMAP_CHUNK_SIZE = 4;
const MAP_CHUNKS_X = 60 / MINIMAP_CHUNK_SIZE;
const MAP_CHUNKS_Y = 60 / MINIMAP_CHUNK_SIZE;

function MinimapCanvas({ data }: { data: MinimapData | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(0, 0, W, H);

    if (data) {
      const explored = new Set(data.exploredChunks);
      const tint = ZONES[data.zone].tint;
      const r = (tint >> 16) & 0xff;
      const g = (tint >> 8) & 0xff;
      const b = tint & 0xff;

      const cw = W / MAP_CHUNKS_X;
      const ch = H / MAP_CHUNKS_Y;

      // Draw explored terrain
      for (let cy = 0; cy < MAP_CHUNKS_Y; cy++) {
        for (let cx = 0; cx < MAP_CHUNKS_X; cx++) {
          if (explored.has(`${cx},${cy}`)) {
            ctx.fillStyle = `rgba(${r},${g},${b},0.18)`;
            ctx.fillRect(cx * cw, cy * ch, cw, ch);
          }
        }
      }

      // Chests — amber squares (only if explored)
      ctx.fillStyle = '#fbbf24';
      for (const c of data.chests) {
        ctx.fillRect(c.nx * W - 2, c.ny * H - 2, 4, 4);
      }

      // Enemies — red dots
      ctx.fillStyle = '#ef4444';
      for (const e of data.enemies) {
        ctx.beginPath();
        ctx.arc(e.nx * W, e.ny * H, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Boss — purple larger dot
      if (data.boss) {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(data.boss.nx * W, data.boss.ny * H, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player glow
      ctx.fillStyle = 'rgba(253,230,138,0.25)';
      ctx.beginPath();
      ctx.arc(data.player.nx * W, data.player.ny * H, 6, 0, Math.PI * 2);
      ctx.fill();
      // Player dot
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(data.player.nx * W, data.player.ny * H, 3, 0, Math.PI * 2);
      ctx.fill();

      // Fog overlay for unexplored chunks
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      for (let cy = 0; cy < MAP_CHUNKS_Y; cy++) {
        for (let cx = 0; cx < MAP_CHUNKS_X; cx++) {
          if (!explored.has(`${cx},${cy}`)) {
            ctx.fillRect(cx * cw, cy * ch, cw, ch);
          }
        }
      }
    }

    // Border
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_PX * 2}
      height={CANVAS_PX * 2}
      style={{ width: CANVAS_PX, height: CANVAS_PX }}
      className="rounded-md opacity-90 mt-2"
    />
  );
}

interface MinimapProps {
  zone: ZoneId;
  minimapData: MinimapData | null;
}

function Minimap({ zone, minimapData }: MinimapProps) {
  const zoneMeta = ZONES[zone];

  return (
    <div className="absolute bottom-4 left-4 pointer-events-none select-none">
      <div className="bg-stone-900/75 backdrop-blur-sm border border-stone-700/60 rounded-xl px-3 py-2.5 shadow-xl">
        <div className="flex items-center gap-1.5 mb-1.5">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
            Region
          </span>
        </div>
        <div
          key={zone}
          className="text-amber-100 font-semibold text-sm leading-tight animate-in fade-in slide-in-from-left-1 duration-300"
        >
          {zoneMeta.name}
        </div>
        <MinimapCanvas data={minimapData} />
      </div>
    </div>
  );
}

interface XPBarProps {
  xp: number;
  level: number;
  nextLevelXp: number | null;
}

function XPBar({ xp, level, nextLevelXp }: XPBarProps) {
  const pct = nextLevelXp ? Math.min(xp / nextLevelXp, 1) : 1;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-bold tracking-widest text-stone-400 uppercase">
          Lv.{level}
        </span>
        <span className="text-[9px] font-mono text-stone-500">
          {nextLevelXp ? `${xp}/${nextLevelXp}` : 'MAX'}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-stone-700/70 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

interface BossHpBarProps {
  hp: number;
  maxHp: number;
  phase: number;
}

function BossHpBar({ hp, maxHp, phase }: BossHpBarProps) {
  const pct = Math.max(0, hp / maxHp);
  const isP2 = phase === 2;
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none select-none w-56 max-w-[70vw]">
      <div className="bg-stone-900/85 backdrop-blur-sm border border-stone-700/60 rounded-xl px-3 py-2 shadow-2xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn(
            'text-[10px] font-bold tracking-widest uppercase font-mono',
            isP2 ? 'text-purple-400' : 'text-red-400'
          )}>
            Void Tyrant
          </span>
          <span className="text-[10px] font-mono text-stone-500">
            {hp}/{maxHp}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-stone-800/80 overflow-hidden border border-stone-700/50">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isP2
                ? 'bg-gradient-to-r from-purple-700 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                : 'bg-gradient-to-r from-red-700 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
            )}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        {isP2 && (
          <div className="mt-1 text-[8px] font-mono text-purple-400 tracking-widest uppercase text-center animate-pulse">
            Phase 2
          </div>
        )}
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
  xp: number;
  level: number;
  nextLevelXp: number | null;
  minimapData: MinimapData | null;
  showHints: boolean;
  shieldCharges: number;
  bossHp: { hp: number; maxHp: number; phase: number } | null;
  onUsePotion?: () => void;
}

export function HUD({ hp, maxHp, isJumping, inventory, zone, xp, level, nextLevelXp, minimapData, showHints, shieldCharges, bossHp, onUsePotion }: HUDProps) {
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
          <XPBar xp={xp} level={level} nextLevelXp={nextLevelXp} />
          {shieldCharges > 0 && (
            <div className="mt-1.5 flex items-center gap-1">
              <span className="text-[9px] font-bold tracking-widest text-stone-400 uppercase mr-0.5">
                Schild
              </span>
              {Array.from({ length: shieldCharges }).map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" className="drop-shadow">
                  <path
                    d="M12 3 L20 6 L20 13 C20 17.5 16 21 12 22 C8 21 4 17.5 4 13 L4 6 Z"
                    fill="#1d4ed8" stroke="#1e40af" strokeWidth="1"
                  />
                  <path
                    d="M12 5 L18 7.5 L18 13 C18 16.5 15 19.5 12 20.5 C9 19.5 6 16.5 6 13 L6 7.5 Z"
                    fill="#3b82f6"
                  />
                  <path d="M12 8 L12 17 M9 12.5 L15 12.5" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ))}
            </div>
          )}
        </div>
      </div>

      <InventoryBar inventory={inventory} onUsePotion={onUsePotion} />

      {bossHp && bossHp.hp > 0 && (
        <BossHpBar hp={bossHp.hp} maxHp={bossHp.maxHp} phase={bossHp.phase} />
      )}

      <Minimap zone={zone} minimapData={minimapData} />

      {isJumping && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none select-none">
          <div className="bg-sky-900/70 backdrop-blur-sm border border-sky-600/50 rounded-full px-4 py-1 shadow-lg animate-bounce">
            <span className="text-sky-300 text-xs font-bold tracking-wider uppercase">
              Jump!
            </span>
          </div>
        </div>
      )}

      {showHints && (
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
      )}
    </>
  );
}
