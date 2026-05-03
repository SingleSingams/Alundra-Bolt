import { useState, useEffect } from 'react';
import { SaveSystem } from '../game/SaveSystem';
import { ZONES, ZoneId } from '../game/constants';
import { submitScore, fetchTopScores, supabaseConfigured, Score } from '../lib/scores';

interface Props {
  isOpen: boolean;
  level: number;
  xp: number;
  zone: ZoneId;
}

type SubmitState = 'idle' | 'submitting' | 'done' | 'error';

export function GameOverScreen({ isOpen, level, xp, zone }: Props) {
  const [name, setName] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [scores, setScores] = useState<Score[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);

  useEffect(() => {
    if (!isOpen || !supabaseConfigured) return;
    setLoadingScores(true);
    fetchTopScores().then(data => {
      setScores(data);
      setLoadingScores(false);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestart = () => {
    SaveSystem.clear();
    window.location.reload();
  };

  const handleSubmit = async () => {
    const trimmed = name.trim().slice(0, 10);
    if (!trimmed) return;
    setSubmitState('submitting');
    const ok = await submitScore({ name: trimmed, level, xp, zone });
    if (ok) {
      setSubmitState('done');
      const updated = await fetchTopScores();
      setScores(updated);
    } else {
      setSubmitState('error');
    }
  };

  const zoneName = ZONES[zone]?.name ?? zone;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/85 overflow-y-auto py-8">
      <div className="w-full max-w-sm space-y-6 text-center px-4">

        {/* Title */}
        <div className="space-y-1">
          <p className="text-stone-500 font-mono text-[10px] tracking-widest uppercase">
            verdant chronicles
          </p>
          <h1 className="text-5xl font-mono font-bold text-red-400 tracking-widest uppercase drop-shadow-lg">
            Game Over
          </h1>
        </div>

        {/* Stats */}
        <div className="bg-stone-900/70 border border-stone-700/60 rounded-xl px-5 py-4 space-y-2">
          <div className="text-[10px] font-bold tracking-widest text-stone-500 uppercase mb-3">
            Statistiken
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-400">Level</span>
            <span className="text-amber-300 font-bold font-mono">{level}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-400">Erfahrung</span>
            <span className="text-amber-300 font-bold font-mono">{xp} XP</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-400">Zone</span>
            <span className="text-amber-300 font-bold font-mono">{zoneName}</span>
          </div>
        </div>

        {/* Supabase leaderboard section */}
        {supabaseConfigured && (
          <div className="space-y-4">
            {submitState !== 'done' ? (
              <div className="space-y-2">
                <div className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">
                  Highscore eintragen
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Dein Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="flex-1 bg-stone-800/80 border border-stone-600/60 rounded-lg px-3 py-2
                      text-amber-100 text-sm font-mono placeholder-stone-600 outline-none
                      focus:border-amber-500/60"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitState === 'submitting' || !name.trim()}
                    className="px-4 py-2 bg-amber-700/70 hover:bg-amber-600 disabled:opacity-40
                      text-amber-100 font-mono text-sm rounded-lg transition-colors"
                  >
                    {submitState === 'submitting' ? '…' : '→'}
                  </button>
                </div>
                {submitState === 'error' && (
                  <p className="text-red-400 text-xs font-mono">Fehler beim Speichern</p>
                )}
              </div>
            ) : (
              <p className="text-emerald-400 text-xs font-mono tracking-wide">
                ✓ Score gespeichert!
              </p>
            )}

            {/* Top scores */}
            <div className="bg-stone-900/70 border border-stone-700/60 rounded-xl px-4 py-3">
              <div className="text-[10px] font-bold tracking-widest text-stone-500 uppercase mb-3">
                Bestenliste
              </div>
              {loadingScores ? (
                <p className="text-stone-600 text-xs font-mono animate-pulse">Laden…</p>
              ) : scores.length === 0 ? (
                <p className="text-stone-600 text-xs font-mono">Noch keine Einträge</p>
              ) : (
                <div className="space-y-1.5">
                  {scores.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-stone-600 w-5 text-right">{i + 1}.</span>
                      <span className="text-amber-200 flex-1 truncate">{s.name}</span>
                      <span className="text-stone-400">Lv.{s.level}</span>
                      <span className="text-stone-500">{s.xp}xp</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleRestart}
          className="w-full px-8 py-3 bg-amber-800/70 hover:bg-amber-700 active:scale-95
            text-amber-200 font-mono text-sm tracking-wider uppercase
            border border-amber-600/50 rounded transition-all duration-150 shadow-lg"
        >
          Neues Spiel
        </button>
      </div>
    </div>
  );
}
