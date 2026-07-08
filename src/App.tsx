import { GameCanvas } from './components/GameCanvas';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <div className="fixed inset-0 bg-stone-950 overflow-hidden" style={{ touchAction: 'none' }}>
      <ErrorBoundary>
        <GameCanvas />
      </ErrorBoundary>
    </div>
  );
}
