import { RECIPES, MATERIALS, MaterialId, CraftStation } from '../game/constants';

interface CraftingScreenProps {
  isOpen: boolean;
  npcName: string;
  station: CraftStation | null;
  materials: Partial<Record<MaterialId, number>>;
  onCraft: (recipeId: string) => void;
  onClose: () => void;
}

export function CraftingScreen({ isOpen, npcName, station, materials, onCraft, onClose }: CraftingScreenProps) {
  if (!isOpen || !station) return null;

  const recipes = RECIPES.filter(r => r.station === station);
  const owned = (id: MaterialId) => materials[id] ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-stone-900 border border-amber-700/60 rounded-2xl shadow-2xl p-5 w-96 max-w-[94vw]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-amber-300 font-bold text-lg">{npcName}</h2>
          <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
            {station === 'forge' ? 'Schmiede' : 'Alchemie'}
          </span>
        </div>
        <p className="text-stone-400 text-xs mb-3">
          {station === 'forge'
            ? 'Bring mir Rohstoffe, und ich verstärke deine Ausrüstung.'
            : 'Aus Kräutern und Essenzen entstehen mächtige Tränke.'}
        </p>

        {/* Materials inventory */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(Object.keys(MATERIALS) as MaterialId[]).map(id => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-lg bg-stone-800/70 border border-stone-700/50 px-2 py-0.5 text-xs"
            >
              <span>{MATERIALS[id].icon}</span>
              <span className="text-stone-300">{MATERIALS[id].label}</span>
              <span className="font-mono font-bold text-amber-300">{owned(id)}</span>
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2 max-h-[46vh] overflow-y-auto pr-1">
          {recipes.map(recipe => {
            const costs = Object.entries(recipe.cost) as Array<[MaterialId, number]>;
            const canCraft = costs.every(([mat, n]) => owned(mat) >= n);
            return (
              <button
                key={recipe.id}
                onClick={() => canCraft && onCraft(recipe.id)}
                disabled={!canCraft}
                className={[
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                  canCraft
                    ? 'border-amber-700/50 bg-amber-950/40 hover:bg-amber-900/50 cursor-pointer'
                    : 'border-stone-700/40 bg-stone-800/30 cursor-not-allowed opacity-55',
                ].join(' ')}
              >
                <span className="text-xl w-7 text-center">{recipe.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-stone-100 font-semibold text-sm">{recipe.label}</div>
                  <div className="text-stone-400 text-xs">{recipe.desc}</div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {costs.map(([mat, n]) => (
                    <span
                      key={mat}
                      className={[
                        'text-[11px] font-mono',
                        owned(mat) >= n ? 'text-emerald-400' : 'text-red-400',
                      ].join(' ')}
                    >
                      {MATERIALS[mat].icon} {owned(mat)}/{n}
                    </span>
                  ))}
                </div>
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
