import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from './ui/card';
import { cn } from '../lib/utils';
import { ChevronRight } from 'lucide-react';

interface DialogBoxProps {
  isOpen: boolean;
  npcName: string;
  lines: string[];
  portrait?: string;
  portraitColumns?: number;
  onClose: () => void;
}

// Portrait images are multi-pose sheets (cols × 2 rows).
// background-size: <cols*100>% shows exactly 1 column (the first/idle pose).
function Portrait({ src, name, columns = 3 }: { src: string; name: string; columns?: number }) {
  return (
    <div
      className="w-14 h-14 rounded-lg border-2 border-amber-600/60 shadow-lg flex-shrink-0 overflow-hidden"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${columns * 100}% auto`,
        backgroundPosition: '0% 0%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'auto',
      }}
      aria-label={name}
    />
  );
}

export function DialogBox({ isOpen, npcName, lines, portrait, portraitColumns, onClose }: DialogBoxProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (isOpen) setPageIndex(0);
  }, [isOpen, npcName]);

  const currentLine = lines[pageIndex] ?? '';

  useEffect(() => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }
    if (!isOpen) { setDisplayed(''); return; }

    setDisplayed('');
    isTypingRef.current = true;
    let i = 0;

    typeIntervalRef.current = setInterval(() => {
      i++;
      setDisplayed(currentLine.slice(0, i));
      if (i >= currentLine.length) {
        clearInterval(typeIntervalRef.current!);
        typeIntervalRef.current = null;
        isTypingRef.current = false;
      }
    }, 26);

    return () => {
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = null;
      }
      isTypingRef.current = false;
    };
  }, [isOpen, currentLine]);

  const advance = useCallback(() => {
    if (!isOpen) return;
    if (isTypingRef.current) {
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = null;
      }
      isTypingRef.current = false;
      setDisplayed(lines[pageIndex] ?? '');
      return;
    }
    setPageIndex((prev) => {
      if (prev + 1 >= lines.length) { onClose(); return prev; }
      return prev + 1;
    });
  }, [isOpen, lines, pageIndex, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'z' || e.key === 'Z' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); advance();
      } else if (e.key === 'Escape') {
        e.preventDefault(); onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, advance, onClose]);

  if (!isOpen) return null;

  const isLast = pageIndex === lines.length - 1;
  const isTypingDone = displayed.length >= currentLine.length;

  return (
    <div
      className="absolute inset-x-0 bottom-0 pointer-events-none flex items-end justify-center z-20 px-3"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto w-full max-w-xl animate-in slide-in-from-bottom-4 fade-in duration-200">
        <Card className="bg-stone-900/95 border-amber-600/50 border-2 backdrop-blur-md shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-amber-900/40 to-stone-900/40 border-b border-amber-700/40">
            {portrait ? (
              <Portrait src={portrait} name={npcName} columns={portraitColumns} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-900/60 border border-blue-500/50 flex items-center justify-center flex-shrink-0 text-lg">
                💬
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-amber-100 font-bold text-sm leading-tight truncate">{npcName}</div>
              <div className="flex gap-1 mt-1">
                {lines.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all duration-300',
                      i === pageIndex ? 'bg-amber-400 scale-125' : i < pageIndex ? 'bg-amber-700/60' : 'bg-stone-600/60'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Text */}
          <button
            onClick={advance}
            className="w-full text-left px-4 py-3 min-h-[68px] bg-transparent border-0 outline-none"
            style={{ color: '#f1f0ef' }}
          >
            <p className="leading-relaxed text-sm">
              {displayed}
              {!isTypingDone && (
                <span className="inline-block w-0.5 h-4 bg-amber-300 ml-0.5 align-middle animate-pulse" />
              )}
            </p>
          </button>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 bg-stone-950/60 border-t border-stone-700/60">
            <div className="text-[11px] text-stone-400">{pageIndex + 1} / {lines.length}</div>
            <button
              onClick={advance}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-600/30 active:bg-amber-600/60 border border-amber-500/50 font-semibold transition-colors"
              style={{ color: '#fde68a', fontSize: '14px' }}
            >
              <span>{!isTypingDone ? 'Überspringen' : isLast ? 'Schließen' : 'Weiter'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
