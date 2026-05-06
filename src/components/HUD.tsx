import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../lib/utils';
import {
  InventoryItem,
  MAX_INVENTORY,
  ZoneId,
  ZONES,
  MinimapData,
  QuestState,
} from '../game/constants';
import { Map, Backpack } from 'lucide-react';

// ─── Heart ───────────────────────────────────────────────────────────────────

type HeartAnimState = 'damage' | 'heal' | null;

function Heart({ filled, half, index, animState }: {
  filled: boolean; half?: boolean; index: number; animState: HeartAnimState;
}) {
  return (
    <div
      className={cn(
        animState === 'damage' && 'heart-shake',
        animState === 'heal' && 'heart-bounce'
      )}
      style={{ transitionDelay: `${index * 30}ms` }}
    >
      <svg width="18" height="17" viewBox="0 0 28 26" className={cn('transition-all duration-200', filled ? 'scale-100' : 'scale-90 opacity-35')}>
        <defs>
          <linearGradient id={`hf-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={filled ? '#f87171' : '#4b5563'} />
            <stop offset="100%" stopColor={filled ? '#dc2626' : '#374151'} />
          </linearGradient>
        </defs>
        <path
          d="M14 23 C14 23 3 15 3 8.5 C3 5.4 5.4 3 8.5 3 C10.24 3 11.91 3.81 13 5.08 C14.09 3.81 15.76 3 17.5 3 C20.6 3 23 5.4 23 8.5 C23 15 14 23 14 23Z"
          fill={`url(#hf-${index})`}
          stroke={filled ? '#b91c1c' : '#374151'}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {filled && <ellipse cx="10" cy="8" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.35)" transform="rotate(-20,10,8)" />}
        {half && (
          <path
            d="M14 23 C14 23 3 15 3 8.5 C3 5.4 5.4 3 8.5 3 C10.24 3 11.91 3.81 13 5.08 L14 23Z"
            fill={`url(#hf-${index})`}
          />
        )}
      </svg>
    </div>
  );
}

// ─── XP Bar ──────────────────────────────────────────────────────────────────

function XPBar({ xp, level, nextLevelXp }: { xp: number; level: number; nextLevelXp: number | null }) {
  const pct = nextLevelXp ? Math.min(xp / nextLevelXp, 1) : 1;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-[9px] font-bold tracking-widest text-amber-400/80 uppercase shrink-0">Lv.{level}</span>
      <div className="flex-1 h-1 rounded-full bg-stone-700/60 overflow-hidden min-w-[48px]">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500" style={{ width: `${pct * 100}%` }} />
      </div>
      {nextLevelXp && (
        <span className="text-[8px] font-mono text-stone-500 shrink-0">{xp}/{nextLevelXp}</span>
      )}
    </div>
  );
}

// ─── Item icons ───────────────────────────────────────────────────────────────

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="inv-heart" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f87171" /><stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <path d="M12 21C12 21 3 14 3 8c0-2.8 2.2-5 5-5 1.7 0 3.2.9 4 2.2C12.8 3.9 14.3 3 16 3c2.8 0 5 2.2 5 5 0 6-9 13-9 13z" fill="url(#inv-heart)" stroke="#7f1d1d" strokeWidth="1.2" strokeLinejoin="round" />
      <ellipse cx="8.5" cy="7.5" rx="1.8" ry="1" fill="rgba(255,255,255,0.45)" transform="rotate(-20,8.5,7.5)" />
    </svg>
  );
}
function SwordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <defs><linearGradient id="inv-blade" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#e5e7eb" /><stop offset="50%" stopColor="#9ca3af" /><stop offset="100%" stopColor="#6b7280" /></linearGradient></defs>
      <polygon points="17,3 21,3 21,7 8,20 5,20 5,17" fill="url(#inv-blade)" stroke="#4b5563" strokeWidth="0.8" strokeLinejoin="round" />
      <rect x="3.5" y="15" width="6" height="2" transform="rotate(-45,6.5,16)" fill="#78350f" stroke="#451a03" strokeWidth="0.6" />
      <circle cx="3" cy="21" r="1.3" fill="#eab308" stroke="#854d0e" strokeWidth="0.5" />
    </svg>
  );
}
function PotionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
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
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M12 3L20 6v7c0 4.5-4 8-8 9-4-1-8-4.5-8-9V6z" fill="#1d4ed8" stroke="#1e40af" strokeWidth="1" />
      <path d="M12 5l6 2.5V13c0 3.5-3 6.5-6 7.5-3-1-6-4-6-7.5V7.5z" fill="#3b82f6" />
      <path d="M12 8v9M9 12.5h6" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ProjectileUpgradeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="7" fill="#fbbf24" opacity="0.4" />
      <circle cx="12" cy="12" r="4" fill="#fef3c7" />
      <circle cx="12" cy="12" r="2.5" fill="#fde68a" />
    </svg>
  );
}

// ─── Inventory panel ─────────────────────────────────────────────────────────

function InventorySlot({ item, index, onUsePotion }: { item?: InventoryItem; index: number; onUsePotion?: () => void }) {
  const hasItem = !!item;
  const isPotion = item === 'potion';
  return (
    <div
      onClick={isPotion ? onUsePotion : undefined}
      className={cn(
        'relative rounded-lg border flex flex-col items-center justify-center gap-0.5 w-12 h-12 transition-all duration-200',
        hasItem
          ? isPotion
            ? 'bg-emerald-900/80 border-emerald-400/70 shadow-[0_0_10px_rgba(74,222,128,0.4)] cursor-pointer active:scale-90'
            : 'bg-stone-800/80 border-amber-600/60'
          : 'bg-stone-900/50 border-stone-700/40 border-dashed'
      )}
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
        <span className="text-[7px] text-emerald-400 font-bold whitespace-nowrap">Tippen</span>
      )}
    </div>
  );
}

// ─── Minimap ─────────────────────────────────────────────────────────────────

const CANVAS_PX = 88;
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
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(0, 0, W, H);

    if (data) {
      const explored = new Set(data.exploredChunks);
      const tint = ZONES[data.zone].tint;
      const r = (tint >> 16) & 0xff, g = (tint >> 8) & 0xff, b = tint & 0xff;
      const cw = W / MAP_CHUNKS_X, ch = H / MAP_CHUNKS_Y;

      for (let cy = 0; cy < MAP_CHUNKS_Y; cy++)
        for (let cx = 0; cx < MAP_CHUNKS_X; cx++)
          if (explored.has(`${cx},${cy}`)) {
            ctx.fillStyle = `rgba(${r},${g},${b},0.18)`;
            ctx.fillRect(cx * cw, cy * ch, cw, ch);
          }

      ctx.fillStyle = '#fbbf24';
      for (const c of data.chests) ctx.fillRect(c.nx * W - 2, c.ny * H - 2, 4, 4);

      ctx.fillStyle = '#ef4444';
      for (const e of data.enemies) { ctx.beginPath(); ctx.arc(e.nx * W, e.ny * H, 2.5, 0, Math.PI * 2); ctx.fill(); }

      if (data.boss) {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath(); ctx.arc(data.boss.nx * W, data.boss.ny * H, 4, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = 'rgba(253,230,138,0.2)';
      ctx.beginPath(); ctx.arc(data.player.nx * W, data.player.ny * H, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath(); ctx.arc(data.player.nx * W, data.player.ny * H, 3, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      for (let cy = 0; cy < MAP_CHUNKS_Y; cy++)
        for (let cx = 0; cx < MAP_CHUNKS_X; cx++)
          if (!explored.has(`${cx},${cy}`)) ctx.fillRect(cx * cw, cy * ch, cw, ch);
    }

    ctx.strokeStyle = '#44403c'; ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_PX * 2}
      height={CANVAS_PX * 2}
      style={{ width: CANVAS_PX, height: CANVAS_PX }}
      className="rounded-md opacity-90"
    />
  );
}

// ─── Boss HP ─────────────────────────────────────────────────────────────────

function BossHpBar({ hp, maxHp, phase }: { hp: number; maxHp: number; phase: number }) {
  const pct = Math.max(0, hp / maxHp);
  const isP2 = phase === 2;
  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none select-none w-52 max-w-[70vw]">
      <div className="bg-stone-900/85 backdrop-blur-sm border border-stone-700/60 rounded-xl px-3 py-2 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <span className={cn('text-[10px] font-bold tracking-widest uppercase', isP2 ? 'text-purple-400' : 'text-red-400')}>
            Leere-Tyrann
          </span>
          <span className="text-[10px] font-mono text-stone-500">{hp}/{maxHp}</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-stone-800/80 overflow-hidden border border-stone-700/50">
          <div
            className={cn('h-full rounded-full transition-all duration-300', isP2
              ? 'bg-gradient-to-r from-purple-700 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
              : 'bg-gradient-to-r from-red-700 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
            )}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        {isP2 && <div className="mt-0.5 text-[8px] text-purple-400 tracking-widest uppercase text-center animate-pulse">Phase 2</div>}
      </div>
    </div>
  );
}

// ─── Control hints ────────────────────────────────────────────────────────────

function ControlBadge({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {keys.map((k) => (
          <kbd key={k} className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-stone-800/90 text-stone-200 rounded border border-stone-600 shadow-sm min-w-[20px] text-center leading-4">{k}</kbd>
        ))}
      </div>
      <span className="text-[11px] text-stone-300 font-medium">{label}</span>
    </div>
  );
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

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
  showTouchControls?: boolean;
  shieldCharges: number;
  bossHp: { hp: number; maxHp: number; phase: number } | null;
  combo?: number;
  quest?: QuestState | null;
  onUsePotion?: () => void;
}

export function HUD({ hp, maxHp, inventory, zone, xp, level, nextLevelXp, minimapData, showHints, showTouchControls, shieldCharges, bossHp, combo, quest, onUsePotion }: HUDProps) {
  const fullHearts = Math.floor(hp / 2);
  const hasHalf = hp % 2 === 1;
  const totalSlots = Math.ceil(maxHp / 2);
  const prevHpRef = useRef(hp);
  const [heartAnim, setHeartAnim] = useState<'damage' | 'heal' | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const toggleBag = useCallback(() => { setBagOpen(v => !v); setMapOpen(false); }, []);
  const toggleMap = useCallback(() => { setMapOpen(v => !v); setBagOpen(false); }, []);

  useEffect(() => {
    const prev = prevHpRef.current;
    if (hp === prev) return;
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setHeartAnim(hp < prev ? 'damage' : 'heal');
    animTimerRef.current = setTimeout(() => setHeartAnim(null), hp < prev ? 380 : 280);
    prevHpRef.current = hp;
  }, [hp]);

  const slots: (InventoryItem | undefined)[] = Array.from({ length: MAX_INVENTORY }, (_, i) => inventory[i]);
  const zoneMeta = ZONES[zone];

  return (
    <>
      {/* ── Top bar ── */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between pointer-events-none select-none"
        style={{ padding: 'max(0.5rem, env(safe-area-inset-top)) max(0.5rem, env(safe-area-inset-right)) 0 max(0.5rem, env(safe-area-inset-left))' }}
      >
        {/* Left: hearts + XP */}
        <div className="bg-stone-900/70 backdrop-blur-sm border border-stone-700/50 rounded-xl px-2.5 py-2 shadow-lg max-w-[55vw]">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: totalSlots }).map((_, i) => (
              <Heart
                key={i}
                index={i}
                filled={i < fullHearts}
                half={i === fullHearts && hasHalf}
                animState={heartAnim}
              />
            ))}
            <span className="text-[9px] text-stone-500 font-mono ml-1 shrink-0">{hp}/{maxHp}</span>
          </div>
          {shieldCharges > 0 && (
            <div className="flex items-center gap-0.5 mt-1">
              <span className="text-[8px] text-stone-500 uppercase tracking-widest mr-0.5">Schild</span>
              {Array.from({ length: shieldCharges }).map((_, i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24">
                  <path d="M12 3L20 6v7c0 4.5-4 8-8 9-4-1-8-4.5-8-9V6z" fill="#1d4ed8" />
                  <path d="M12 5l6 2.5V13c0 3.5-3 6.5-6 7.5-3-1-6-4-6-7.5V7.5z" fill="#3b82f6" />
                </svg>
              ))}
            </div>
          )}
          <XPBar xp={xp} level={level} nextLevelXp={nextLevelXp} />
        </div>

        {/* Right: icon buttons */}
        <div className="flex gap-2 pointer-events-auto">
          {/* Bag toggle */}
          <button
            onClick={toggleBag}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border transition-all active:scale-90',
              bagOpen
                ? 'bg-amber-700/80 border-amber-400/70 text-amber-100'
                : 'bg-stone-900/70 backdrop-blur-sm border-stone-700/50 text-stone-300'
            )}
          >
            <Backpack className="w-5 h-5" />
          </button>
          {/* Map toggle */}
          <button
            onClick={toggleMap}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border transition-all active:scale-90',
              mapOpen
                ? 'bg-emerald-800/80 border-emerald-400/70 text-emerald-100'
                : 'bg-stone-900/70 backdrop-blur-sm border-stone-700/50 text-stone-300'
            )}
          >
            <Map className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Inventory panel (drops below buttons) ── */}
      {bagOpen && (
        <div
          className="absolute z-30 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            top: 'calc(max(0.5rem, env(safe-area-inset-top)) + 3rem)',
            right: 'max(0.5rem, env(safe-area-inset-right))',
          }}
        >
          <div className="bg-stone-900/90 backdrop-blur-sm border border-stone-700/60 rounded-xl px-3 py-2.5 shadow-2xl">
            <div className="text-[9px] font-bold tracking-widest text-stone-500 uppercase mb-2">Rucksack</div>
            <div className="flex gap-2">
              {slots.map((item, i) => (
                <InventorySlot
                  key={i}
                  item={item}
                  index={i}
                  onUsePotion={item === 'potion' ? () => { onUsePotion?.(); setBagOpen(false); } : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Minimap panel ── */}
      {mapOpen && (
        <div
          className="absolute z-30 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            top: 'calc(max(0.5rem, env(safe-area-inset-top)) + 3rem)',
            right: 'max(0.5rem, env(safe-area-inset-right))',
          }}
        >
          <div className="bg-stone-900/90 backdrop-blur-sm border border-stone-700/60 rounded-xl px-2.5 py-2.5 shadow-2xl">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: `#${zoneMeta.tint.toString(16).padStart(6, '0')}` }} />
              <span className="text-[9px] font-bold tracking-widest text-stone-400 uppercase truncate max-w-[80px]">{zoneMeta.name}</span>
            </div>
            <MinimapCanvas data={minimapData} />
          </div>
        </div>
      )}

      {/* ── Boss HP bar ── */}
      {bossHp && bossHp.hp > 0 && (
        <BossHpBar hp={bossHp.hp} maxHp={bossHp.maxHp} phase={bossHp.phase} />
      )}

      {/* ── Combo ── */}
      {combo !== undefined && combo >= 3 && (
        <div
          key={combo}
          className="absolute top-16 right-4 pointer-events-none select-none animate-in zoom-in fade-in duration-200"
          style={{ right: 'max(1rem, env(safe-area-inset-right))' }}
        >
          <div className={cn(
            'rounded-xl px-2.5 py-1.5 shadow-2xl border text-right',
            combo >= 10 ? 'bg-red-900/85 border-red-400/60' : combo >= 5 ? 'bg-orange-900/85 border-orange-400/60' : 'bg-amber-900/80 border-amber-500/60'
          )}>
            <div className={cn('font-extrabold font-mono leading-none tabular-nums', combo >= 10 ? 'text-red-300 text-2xl' : combo >= 5 ? 'text-orange-300 text-xl' : 'text-amber-300 text-lg')}>
              {combo}×
            </div>
            <div className="text-[9px] tracking-widest uppercase font-bold text-stone-400 mt-0.5">Combo</div>
          </div>
        </div>
      )}

      {/* ── Quest badge ── */}
      {quest && (
        <div
          className="absolute pointer-events-none select-none"
          style={{
            top: 'calc(max(0.5rem, env(safe-area-inset-top)) + 3.5rem)',
            left: 'max(0.5rem, env(safe-area-inset-left))',
          }}
        >
          <div className="bg-stone-900/80 backdrop-blur-sm border border-amber-700/50 rounded-xl px-2.5 py-1.5 shadow-lg max-w-[180px]">
            <div className="text-[8px] font-bold tracking-widest text-amber-500/80 uppercase mb-1">Aufgabe</div>
            <div className="text-[11px] text-amber-100 font-medium leading-tight">{quest.label}</div>
            {quest.goal > 1 && (
              <div className="mt-1 flex items-center gap-1.5">
                <div className="flex-1 h-1 rounded-full bg-stone-700/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min((quest.progress / quest.goal) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-stone-400 shrink-0">{quest.progress}/{quest.goal}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Keyboard hints (desktop) ── */}
      {showHints && !showTouchControls && (
        <div className="absolute bottom-4 right-4 pointer-events-none select-none">
          <div className="bg-stone-900/75 backdrop-blur-sm border border-stone-700/60 rounded-xl px-3 py-2.5 shadow-xl space-y-1.5">
            <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1.5">Steuerung</div>
            <ControlBadge keys={['W', 'A', 'S', 'D']} label="Bewegen" />
            <ControlBadge keys={['Z', 'Spc']} label="Springen / Öffnen" />
            <ControlBadge keys={['X']} label="Angriff" />
            <ControlBadge keys={['Y']} label="Fernkampf" />
          </div>
        </div>
      )}
    </>
  );
}
