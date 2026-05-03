import { SaveSystem } from '../game/SaveSystem';
import { Settings } from '../game/SettingsSystem';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  settings: Settings;
  onSettingsChange: (s: Settings) => void;
}

export function PauseMenu({ isOpen, onResume, settings, onSettingsChange }: PauseMenuProps) {
  if (!isOpen) return null;

  const handleNewGame = () => {
    if (window.confirm('Spielstand löschen und neu starten?')) {
      SaveSystem.clear();
      window.location.reload();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-stone-900/95 border border-stone-700/80 rounded-2xl px-8 py-7 shadow-2xl w-72 text-center">
        <div className="w-2 h-2 rounded-full bg-amber-500 mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-extrabold text-amber-100 tracking-widest uppercase mb-1">
          Pause
        </h2>
        <p className="text-[11px] text-stone-500 mb-5 tracking-wide">ESC zum Fortfahren</p>

        {/* Settings */}
        <div className="text-left space-y-3 mb-5 border-t border-stone-700/60 pt-4">
          <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2">
            Einstellungen
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-400 w-16 shrink-0">Lautstärke</span>
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={settings.volume}
              onChange={(e) => onSettingsChange({ ...settings, volume: parseFloat(e.target.value) })}
              className="flex-1 accent-amber-500 h-1"
            />
            <span className="text-[10px] font-mono text-stone-500 w-7 text-right">
              {Math.round(settings.volume * 100)}
            </span>
          </div>

          {/* Show hints */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] text-stone-400">Steuerungshinweise</span>
            <button
              role="switch"
              aria-checked={settings.showHints}
              onClick={() => onSettingsChange({ ...settings, showHints: !settings.showHints })}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                settings.showHints ? 'bg-amber-600' : 'bg-stone-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.showHints ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>

          {/* Touch controls */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] text-stone-400">Touch-Steuerung</span>
            <button
              role="switch"
              aria-checked={settings.showTouchControls}
              onClick={() => onSettingsChange({ ...settings, showTouchControls: !settings.showTouchControls })}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                settings.showTouchControls ? 'bg-amber-600' : 'bg-stone-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.showTouchControls ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-stone-700/60 pt-4">
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
