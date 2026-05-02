import { SaveSystem } from '../game/SaveSystem';

interface Props {
  isOpen: boolean;
}

export function GameOverScreen({ isOpen }: Props) {
  if (!isOpen) return null;

  const handleRestart = () => {
    SaveSystem.clear();
    window.location.reload();
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/80 animate-fade-in">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <p className="text-stone-500 font-mono text-xs tracking-widest uppercase">verdant chronicles</p>
          <h1 className="text-5xl font-mono font-bold text-red-400 tracking-widest uppercase drop-shadow-lg">
            Game Over
          </h1>
        </div>
        <button
          onClick={handleRestart}
          className="px-8 py-3 bg-amber-800/70 hover:bg-amber-700 active:scale-95
            text-amber-200 font-mono text-sm tracking-wider uppercase
            border border-amber-600/50 rounded transition-all duration-150 shadow-lg"
        >
          Neues Spiel
        </button>
      </div>
    </div>
  );
}
