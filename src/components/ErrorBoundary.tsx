import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 text-center px-6 z-[999]">
            <div className="w-full max-w-xs space-y-4">
              <div className="text-4xl font-mono font-bold text-red-500 tracking-widest uppercase">
                Fehler
              </div>
              <p className="text-stone-400 text-sm font-mono leading-relaxed">
                Ein unerwarteter Fehler ist aufgetreten.
              </p>
              <p className="text-stone-600 text-xs font-mono break-all">
                {this.state.error.message}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 rounded-xl bg-amber-800/70 hover:bg-amber-700 active:scale-95
                  border border-amber-600/50 text-amber-200 font-mono text-sm tracking-wider
                  uppercase transition-all duration-150"
              >
                Neu laden
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
