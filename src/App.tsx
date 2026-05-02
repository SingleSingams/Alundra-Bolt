import { GameCanvas } from './components/GameCanvas';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { SaveSystem } from './game/SaveSystem';

function TitleBar() {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-stone-950 border-b border-stone-800 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-700 border border-emerald-500 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              className="fill-emerald-300"
            >
              <path d="M8 1 L10 6 L15 6 L11 9.5 L12.5 14.5 L8 11.5 L3.5 14.5 L5 9.5 L1 6 L6 6 Z" />
            </svg>
          </div>
          <span className="text-stone-100 font-bold text-sm tracking-wide">
            Verdant Chronicles
          </span>
        </div>
        <Separator orientation="vertical" className="h-4 bg-stone-700" />
        <span className="text-stone-500 text-xs font-mono">v0.1.0 — Scaffold</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-emerald-400 border-emerald-800 bg-emerald-950/50 text-[10px] px-2">
          Action-Adventure
        </Badge>
        <Badge variant="outline" className="text-sky-400 border-sky-800 bg-sky-950/50 text-[10px] px-2">
          Top-Down
        </Badge>
        <Badge variant="outline" className="text-amber-400 border-amber-800 bg-amber-950/50 text-[10px] px-2">
          Phaser 3
        </Badge>
        <Separator orientation="vertical" className="h-4 bg-stone-700" />
        <button
          onClick={() => {
            if (window.confirm('Spielstand löschen und neu starten?')) {
              SaveSystem.clear();
              window.location.reload();
            }
          }}
          className="text-[10px] font-mono text-stone-400 hover:text-red-400 transition-colors px-1"
        >
          Neues Spiel
        </button>
      </div>
    </header>
  );
}

function StatusBar() {
  return (
    <footer className="flex items-center justify-between px-4 py-1.5 bg-stone-950 border-t border-stone-800 flex-shrink-0">
      <div className="flex items-center gap-4">
        <span className="text-[10px] text-stone-600 font-mono">
          Tile: 32px &bull; Map: 60x60 &bull; Zoom: 1.5x
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-stone-500 font-mono">Engine Running</span>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="flex flex-col w-screen h-screen bg-stone-950 overflow-hidden">
      <TitleBar />
      <main className="flex-1 relative overflow-hidden min-h-0">
        <GameCanvas />
      </main>
      <StatusBar />
    </div>
  );
}
