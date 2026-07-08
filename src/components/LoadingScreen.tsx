interface LoadingScreenProps {
  progress: number; // 0–1
}

export function LoadingScreen({ progress }: LoadingScreenProps) {
  const pct = Math.round(progress * 100);

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-stone-950">
      <div className="text-center space-y-6 select-none">
        <p className="text-stone-600 font-mono text-[10px] tracking-[0.3em] uppercase">
          verdant chronicles
        </p>
        <h1 className="text-3xl font-mono font-extrabold text-amber-300 tracking-widest uppercase drop-shadow-lg">
          Wird geladen
        </h1>

        <div className="w-64 space-y-1.5">
          <div className="w-full h-2 bg-stone-800/80 rounded-full overflow-hidden border border-stone-700/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-700 to-amber-400 transition-all duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-right text-[10px] font-mono text-stone-600">
            {pct}%
          </div>
        </div>

        {pct >= 100 && (
          <p className="text-amber-500/70 font-mono text-xs tracking-widest animate-pulse">
            Bereit…
          </p>
        )}
      </div>
    </div>
  );
}
