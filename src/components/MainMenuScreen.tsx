import { useState } from 'react';
import { SaveSystem, SlotPreview } from '../game/SaveSystem';
import { SettingsSystem, Settings } from '../game/SettingsSystem';

type Screen = 'main' | 'slots-new' | 'slots-continue' | 'settings';

interface Props {
  onNewGame: (slot: number) => void;
  onContinue: (slot: number) => void;
}

function formatDate(ts: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function SlotCard({
  index,
  preview,
  onClick,
  danger,
}: {
  index: number;
  preview: SlotPreview | null;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 active:scale-95',
        danger
          ? 'border-red-700/50 bg-red-950/40 hover:bg-red-900/50 text-red-200'
          : preview
          ? 'border-emerald-700/50 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-100'
          : 'border-stone-700/50 bg-stone-800/40 hover:bg-stone-700/40 text-stone-300',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-mono font-bold tracking-widest text-stone-500 uppercase">
          Slot {index + 1}
        </span>
        {preview && (
          <span className="text-[10px] font-mono text-stone-600">{formatDate(preview.savedAt)}</span>
        )}
      </div>
      {preview ? (
        <div className="flex items-center gap-3">
          <span className="font-bold font-mono text-sm">Lv.{preview.level}</span>
          <span className="text-[11px] text-stone-400 truncate">{preview.zone}</span>
          <span className="ml-auto text-[10px] font-mono text-stone-500">{preview.xp} XP</span>
        </div>
      ) : (
        <span className="text-xs font-mono text-stone-600 italic">Leer</span>
      )}
    </button>
  );
}

export function MainMenuScreen({ onNewGame, onContinue }: Props) {
  const [screen, setScreen] = useState<Screen>('main');
  const [settings, setSettings] = useState<Settings>(() => SettingsSystem.load());
  const slots = SaveSystem.listSlots();
  const hasAnySave = slots.some(Boolean);

  const handleSettingChange = (key: keyof Settings, value: number | boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    SettingsSystem.save(next);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 px-6">
      <div className="w-full max-w-xs space-y-6 text-center">

        {/* Title */}
        <div className="space-y-1">
          <p className="text-[10px] font-mono tracking-[0.3em] text-emerald-600 uppercase">
            Ein Abenteuer wartet
          </p>
          <h1 className="text-4xl font-extrabold font-mono text-emerald-300 tracking-wider drop-shadow-lg">
            Verdant
          </h1>
          <h1 className="text-4xl font-extrabold font-mono text-amber-300 tracking-wider -mt-1 drop-shadow-lg">
            Chronicles
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-700/60 to-transparent mt-3" />
        </div>

        {/* MAIN */}
        {screen === 'main' && (
          <div className="space-y-3">
            {hasAnySave && (
              <button
                onClick={() => setScreen('slots-continue')}
                className="w-full py-4 rounded-xl bg-emerald-800/70 hover:bg-emerald-700 active:scale-95
                  border border-emerald-600/60 text-emerald-100 font-mono font-bold text-base
                  tracking-wider uppercase transition-all duration-150 shadow-lg"
              >
                Fortsetzen
              </button>
            )}
            <button
              onClick={() => setScreen('slots-new')}
              className="w-full py-4 rounded-xl bg-amber-800/60 hover:bg-amber-700 active:scale-95
                border border-amber-600/50 text-amber-100 font-mono font-bold text-base
                tracking-wider uppercase transition-all duration-150 shadow-lg"
            >
              Neues Spiel
            </button>
            <button
              onClick={() => setScreen('settings')}
              className="w-full py-3 rounded-xl bg-stone-800/60 hover:bg-stone-700 active:scale-95
                border border-stone-600/50 text-stone-300 font-mono text-sm
                tracking-wider uppercase transition-all duration-150"
            >
              Einstellungen
            </button>
          </div>
        )}

        {/* SLOT PICKER: NEW GAME */}
        {screen === 'slots-new' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold tracking-widest text-stone-400 uppercase">
              Slot wählen
            </h2>
            <div className="space-y-2">
              {slots.map((preview, i) => (
                <SlotCard
                  key={i}
                  index={i}
                  preview={preview}
                  danger={!!preview}
                  onClick={() => {
                    if (preview && !window.confirm(`Slot ${i + 1} überschreiben?`)) return;
                    onNewGame(i);
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => setScreen('main')}
              className="w-full py-3 rounded-xl border border-stone-700 text-stone-300 font-mono text-sm tracking-wider"
            >
              ← Zurück
            </button>
          </div>
        )}

        {/* SLOT PICKER: CONTINUE */}
        {screen === 'slots-continue' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold tracking-widest text-stone-400 uppercase">
              Spielstand laden
            </h2>
            <div className="space-y-2">
              {slots.map((preview, i) => (
                <SlotCard
                  key={i}
                  index={i}
                  preview={preview}
                  onClick={() => preview && onContinue(i)}
                />
              ))}
            </div>
            <button
              onClick={() => setScreen('main')}
              className="w-full py-3 rounded-xl border border-stone-700 text-stone-300 font-mono text-sm tracking-wider"
            >
              ← Zurück
            </button>
          </div>
        )}

        {/* SETTINGS */}
        {screen === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-widest text-stone-400 uppercase">Einstellungen</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-300">Lautstärke</span>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={settings.volume}
                  onChange={e => handleSettingChange('volume', parseFloat(e.target.value))}
                  className="w-28 accent-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-300">Steuerung einblenden</span>
                <button
                  onClick={() => handleSettingChange('showHints', !settings.showHints)}
                  className={[
                    'w-10 h-6 rounded-full transition-colors',
                    settings.showHints ? 'bg-emerald-600' : 'bg-stone-700',
                  ].join(' ')}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-300">Touch-Tasten</span>
                <button
                  onClick={() => handleSettingChange('showTouchControls', !settings.showTouchControls)}
                  className={[
                    'w-10 h-6 rounded-full transition-colors',
                    settings.showTouchControls ? 'bg-emerald-600' : 'bg-stone-700',
                  ].join(' ')}
                />
              </div>
            </div>
            <button
              onClick={() => setScreen('main')}
              className="w-full py-3 rounded-xl border border-stone-700 text-stone-300 font-mono text-sm tracking-wider"
            >
              ← Zurück
            </button>
          </div>
        )}

        <p className="text-[10px] text-stone-700 font-mono">v0.1.0</p>
      </div>
    </div>
  );
}
