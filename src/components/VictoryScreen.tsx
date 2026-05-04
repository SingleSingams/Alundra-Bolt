import { SaveSystem } from '../game/SaveSystem';

interface Props {
  isOpen: boolean;
  level: number;
  xp: number;
  ngPlus: number;
}

export function VictoryScreen({ isOpen, level, xp, ngPlus }: Props) {
  if (!isOpen) return null;

  const handleNgPlus = () => {
    const save = SaveSystem.load();
    SaveSystem.save({
      hp: 6,
      zone: 'grasslands',
      inventory: [],
      xp: save?.xp ?? xp,
      level: save?.level ?? level,
      savedAt: Date.now(),
      killedEnemies: [],
      ngPlus: ngPlus + 1,
    });
    window.location.reload();
  };

  const handleMainMenu = () => {
    window.location.reload();
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/90 px-6">
      <div className="w-full max-w-xs space-y-6 text-center">

        {/* Title */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono tracking-[0.3em] text-amber-600 uppercase animate-pulse">
            {ngPlus > 0 ? `New Game+ ${ngPlus} abgeschlossen` : 'Sieg'}
          </p>
          <h1 className="text-5xl font-mono font-bold text-amber-300 tracking-widest drop-shadow-lg">
            Gewonnen!
          </h1>
          <p className="text-stone-400 text-sm font-mono leading-relaxed">
            Der Leere-Tyrann ist besiegt.<br />Das Verlies liegt in Trümmern.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-stone-900/70 border border-amber-700/40 rounded-xl px-5 py-4 space-y-2">
          <div className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-3">
            Statistiken
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-400">Stufe</span>
            <span className="text-amber-300 font-bold font-mono">{level}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-400">Erfahrung</span>
            <span className="text-amber-300 font-bold font-mono">{xp} XP</span>
          </div>
          {ngPlus > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">New Game+</span>
              <span className="text-purple-400 font-bold font-mono">+{ngPlus}</span>
            </div>
          )}
        </div>

        {/* NG+ info */}
        <div className="bg-purple-950/40 border border-purple-700/40 rounded-xl px-4 py-3 text-xs text-purple-300 font-mono text-center space-y-1">
          <div className="font-bold text-purple-200">New Game+</div>
          <div className="text-stone-400">
            Stärker, schneller, gefährlicher.<br />
            Deine Erfahrung und dein Level bleiben erhalten.
          </div>
          <div className="text-purple-400 font-bold">
            Gegner: ×{Math.pow(1.5, ngPlus + 1).toFixed(1)} HP · ×{Math.pow(1.25, ngPlus + 1).toFixed(2)} Schaden
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleNgPlus}
            className="w-full py-4 rounded-xl bg-purple-800/70 hover:bg-purple-700 active:scale-95
              border border-purple-600/60 text-purple-100 font-mono font-bold text-base
              tracking-wider uppercase transition-all duration-150 shadow-lg"
          >
            New Game+ starten
          </button>
          <button
            onClick={handleMainMenu}
            className="w-full py-3 rounded-xl bg-stone-800/60 hover:bg-stone-700 active:scale-95
              border border-stone-600/50 text-stone-300 font-mono text-sm
              tracking-wider uppercase transition-all duration-150"
          >
            Hauptmenü
          </button>
        </div>
      </div>
    </div>
  );
}
