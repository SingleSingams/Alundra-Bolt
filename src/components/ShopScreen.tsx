import { ShopItem } from '../game/constants';

interface ShopScreenProps {
  isOpen: boolean;
  npcName: string;
  items: ShopItem[];
  xp: number;
  onBuy: (itemId: string) => void;
  onClose: () => void;
}

export function ShopScreen({ isOpen, npcName, items, xp, onBuy, onClose }: ShopScreenProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-stone-900 border border-amber-700/60 rounded-2xl shadow-2xl p-5 w-80 max-w-[92vw]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-amber-300 font-bold text-lg">{npcName}</h2>
          <span className="text-yellow-400 font-mono font-bold text-sm bg-yellow-950/60 border border-yellow-600/40 rounded px-2 py-0.5">
            {xp} XP
          </span>
        </div>
        <p className="text-stone-400 text-xs mb-4">Was darf es sein, Abenteurer?</p>
        <div className="flex flex-col gap-2">
          {items.map(item => {
            const canAfford = xp >= item.xpCost;
            return (
              <button
                key={item.id}
                onClick={() => canAfford && onBuy(item.id)}
                disabled={!canAfford}
                className={[
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                  canAfford
                    ? 'border-amber-700/50 bg-amber-950/40 hover:bg-amber-900/50 cursor-pointer'
                    : 'border-stone-700/40 bg-stone-800/30 cursor-not-allowed opacity-50',
                ].join(' ')}
              >
                <span className="text-xl w-7 text-center">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-stone-100 font-semibold text-sm">{item.label}</div>
                  <div className="text-stone-400 text-xs">{item.desc}</div>
                </div>
                <span className={['font-mono font-bold text-sm', canAfford ? 'text-yellow-400' : 'text-stone-500'].join(' ')}>
                  {item.xpCost} XP
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-stone-700/50 bg-stone-800/50 hover:bg-stone-700/50 text-stone-300 text-sm py-2 font-semibold transition-colors"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
