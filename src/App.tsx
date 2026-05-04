import { GameCanvas } from './components/GameCanvas';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <div className="w-screen h-screen bg-stone-950 overflow-hidden" style={{ touchAction: 'none' }}>
      <ErrorBoundary>
        <GameCanvas />
      </ErrorBoundary>
    </div>
  );
}
