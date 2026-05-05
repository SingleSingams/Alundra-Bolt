import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from './ui/card';
import { cn } from '../lib/utils';
import { MessageSquare, ChevronRight } from 'lucide-react';

interface DialogBoxProps {
  isOpen: boolean;
  npcName: string;
  lines: string[];
  onClose: () => void;
}

export function DialogBox({ isOpen, npcName, lines, onClose }: DialogBoxProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (isOpen) setPageIndex(0);
  }, [isOpen, npcName]);

  const currentLine = lines[pageIndex] ?? '';

  // Typewriter effect
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
    // Skip typewriter if still animating
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
      if (prev + 1 >= lines.length) {
        onClose();
        return prev;
      }
      return prev + 1;
    });
  }, [isOpen, lines, pageIndex, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'z' || e.key === 'Z' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, advance, onClose]);

  if (!isOpen) return null;

  const isLast = pageIndex === lines.length - 1;
  const isTypingDone = displayed.length >= currentLine.length;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-8 z-20">
      <div className="pointer-events-auto w-[min(640px,calc(100%-3rem))] animate-in slide-in-from-bottom-4 fade-in duration-200">
        <Card className="bg-stone-900/95 border-amber-600/50 border-2 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-900/40 to-stone-900/40 border-b border-amber-700/40">
            <div className="w-7 h-7 rounded-full bg-blue-700 border border-blue-400/60 flex items-center justify-center shadow-inner">
              <MessageSquare className="w-3.5 h-3.5 text-blue-100" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400/80 font-bold">
                Gespräch mit
              </div>
              <div className="text-amber-100 font-semibold tracking-wide leading-tight">
                {npcName}
              </div>
            </div>
            <div className="flex gap-1">
              {lines.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all duration-300',
                    i === pageIndex
                      ? 'bg-amber-400 scale-125'
                      : i < pageIndex
                      ? 'bg-amber-700/60'
                      : 'bg-stone-600/60'
                  )}
                />
              ))}
            </div>
          </div>

          <div className="px-5 py-4 min-h-[88px]">
            <p className="text-stone-100 leading-relaxed text-sm">
              {displayed}
              {!isTypingDone && (
                <span className="inline-block w-0.5 h-4 bg-amber-300 ml-0.5 align-middle animate-pulse" />
              )}
            </p>
          </div>

          <div className="flex items-center justify-between px-4 py-2 bg-stone-950/60 border-t border-stone-700/60">
            <div className="text-[11px] text-stone-400">
              Seite <span className="text-amber-300 font-semibold">{pageIndex + 1}</span>{' '}
              von <span className="text-stone-300">{lines.length}</span>
            </div>
            <button
              onClick={advance}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-200 text-xs font-medium transition-colors"
            >
              <kbd className="px-1 py-0.5 text-[9px] font-mono bg-stone-800 rounded border border-stone-600 leading-none">
                Z
              </kbd>
              <span>{!isTypingDone ? 'Überspringen' : isLast ? 'Schließen' : 'Weiter'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
