import { SaveSystem } from '../game/SaveSystem';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
}

export function PauseMenu({ isOpen, onResume }: PauseMenuProps) {
  if (!isOpen) return null;

  const handleNewGame = () => {
    if (window.confirm('Spielstand löschen und neu starten?')) {
      SaveSystem.clear();
      window.location.reload();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-stone-900/95 border border-stone-700/80 rounded-2xl px-10 py-8 shadow-2xl min-w-[260px] text-center">
        <div className="w-2 h-2 rounded-full bg-amber-500 mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-extrabold text-amber-100 tracking-widest uppercase mb-1">
          Pause
        </h2>
        <p className="text-[11px] text-stone-500 mb-7 tracking-wide">ESC zum Fortfahren</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-900 font-bold rounded-lg transition-colors tracking-wide text-sm"
          >
            Fortfahren
          </button>
          <button
            onClick={handleNewGame}
            className="px-6 py-2.5 bg-stone-700 hover:bg-stone-600 active:bg-stone-800 text-stone-200 font-semibold rounded-lg transition-colors text-sm"
          >
            Neues Spiel
          </button>
        </div>
      </div>
    </div>
  );
}
