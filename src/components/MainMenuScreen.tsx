import { useState } from 'react';
import { SaveSystem } from '../game/SaveSystem';
import { SettingsSystem, Settings } from '../game/SettingsSystem';

interface Props {
  onNewGame: () => void;
  onContinue: () => void;
}

export function MainMenuScreen({ onNewGame, onContinue }: Props) {
  const hasSave = SaveSystem.exists();
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => SettingsSystem.load());

  const handleSettingChange = (key: keyof Settings, value: number | boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    SettingsSystem.save(next);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 px-6">
      <div className="w-full max-w-xs space-y-8 text-center">

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

        {showSettings ? (
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
              onClick={() => setShowSettings(false)}
              className="w-full py-3 rounded-xl border border-stone-700 text-stone-300 font-mono text-sm tracking-wider"
            >
              ← Zurück
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {hasSave && (
              <button
                onClick={onContinue}
                className="w-full py-4 rounded-xl bg-emerald-800/70 hover:bg-emerald-700 active:scale-95
                  border border-emerald-600/60 text-emerald-100 font-mono font-bold text-base
                  tracking-wider uppercase transition-all duration-150 shadow-lg"
              >
                Fortsetzen
              </button>
            )}
            <button
              onClick={onNewGame}
              className="w-full py-4 rounded-xl bg-amber-800/60 hover:bg-amber-700 active:scale-95
                border border-amber-600/50 text-amber-100 font-mono font-bold text-base
                tracking-wider uppercase transition-all duration-150 shadow-lg"
            >
              Neues Spiel
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full py-3 rounded-xl bg-stone-800/60 hover:bg-stone-700 active:scale-95
                border border-stone-600/50 text-stone-300 font-mono text-sm
                tracking-wider uppercase transition-all duration-150"
            >
              Einstellungen
            </button>
          </div>
        )}

        <p className="text-[10px] text-stone-700 font-mono">v0.1.0</p>
      </div>
    </div>
  );
}
