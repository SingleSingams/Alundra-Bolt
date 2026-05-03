import { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { createGameConfig } from '../game/GameConfig';
import {
  GAME_EVENTS,
  MAX_HP,
  InventoryItem,
  ZoneId,
  DialogPayload,
  XP_THRESHOLDS,
} from '../game/constants';
import { HUD } from './HUD';
import { DialogBox } from './DialogBox';
import { GameOverScreen } from './GameOverScreen';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hp, setHp] = useState(MAX_HP);
  const [isJumping, setIsJumping] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [zone, setZone] = useState<ZoneId>('grasslands');
  const [dialog, setDialog] = useState<DialogPayload | null>(null);
  const [saveNotice, setSaveNotice] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [nextLevelXp, setNextLevelXp] = useState<number | null>(XP_THRESHOLDS[0]);
  const [levelUpNotice, setLevelUpNotice] = useState<number | null>(null);

  const handleHpChange = useCallback((newHp: number) => setHp(newHp), []);
  const handleJump = useCallback(() => setIsJumping(true), []);
  const handleLand = useCallback(() => setIsJumping(false), []);
  const handleInventoryChange = useCallback(
    (items: InventoryItem[]) => setInventory(items),
    []
  );
  const handleZoneChange = useCallback((z: ZoneId) => setZone(z), []);
  const handleDialogOpen = useCallback(
    (payload: DialogPayload) => setDialog(payload),
    []
  );
  const handleSaveLoaded = useCallback(() => {
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2500);
  }, []);
  const handleGameOver = useCallback(() => setGameOver(true), []);
  const handleXpChange = useCallback(
    (data: { xp: number; level: number; nextLevelXp: number | null }) => {
      setXp(data.xp);
      setLevel(data.level);
      setNextLevelXp(data.nextLevelXp);
    },
    []
  );
  const handleLevelUp = useCallback((newLevel: number) => {
    setLevelUpNotice(newLevel);
    setTimeout(() => setLevelUpNotice(null), 2200);
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
    gameRef.current?.events.emit(GAME_EVENTS.DIALOG_CLOSE);
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = createGameConfig(containerRef.current);
    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.on(GAME_EVENTS.HP_CHANGE, handleHpChange);
    game.events.on(GAME_EVENTS.PLAYER_JUMP, handleJump);
    game.events.on(GAME_EVENTS.PLAYER_LAND, handleLand);
    game.events.on(GAME_EVENTS.INVENTORY_CHANGE, handleInventoryChange);
    game.events.on(GAME_EVENTS.ZONE_CHANGE, handleZoneChange);
    game.events.on(GAME_EVENTS.DIALOG_OPEN, handleDialogOpen);
    game.events.on(GAME_EVENTS.SAVE_LOADED, handleSaveLoaded);
    game.events.on(GAME_EVENTS.GAME_OVER, handleGameOver);
    game.events.on(GAME_EVENTS.XP_CHANGE, handleXpChange);
    game.events.on(GAME_EVENTS.LEVEL_UP, handleLevelUp);

    return () => {
      game.events.off(GAME_EVENTS.HP_CHANGE, handleHpChange);
      game.events.off(GAME_EVENTS.PLAYER_JUMP, handleJump);
      game.events.off(GAME_EVENTS.PLAYER_LAND, handleLand);
      game.events.off(GAME_EVENTS.INVENTORY_CHANGE, handleInventoryChange);
      game.events.off(GAME_EVENTS.ZONE_CHANGE, handleZoneChange);
      game.events.off(GAME_EVENTS.DIALOG_OPEN, handleDialogOpen);
      game.events.off(GAME_EVENTS.SAVE_LOADED, handleSaveLoaded);
      game.events.off(GAME_EVENTS.GAME_OVER, handleGameOver);
      game.events.off(GAME_EVENTS.XP_CHANGE, handleXpChange);
      game.events.off(GAME_EVENTS.LEVEL_UP, handleLevelUp);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [
    handleHpChange,
    handleJump,
    handleLand,
    handleInventoryChange,
    handleZoneChange,
    handleDialogOpen,
    handleSaveLoaded,
    handleGameOver,
    handleXpChange,
    handleLevelUp,
  ]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {/* Vignette: dark radial gradient frames the scene */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.60) 100%)',
        }}
      />
      <HUD
        hp={hp}
        maxHp={MAX_HP}
        isJumping={isJumping}
        inventory={inventory}
        zone={zone}
        xp={xp}
        level={level}
        nextLevelXp={nextLevelXp}
      />
      {levelUpNotice !== null && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 text-center animate-in fade-in zoom-in duration-300">
          <div className="bg-amber-900/80 border-2 border-amber-400/80 text-amber-200 font-bold
            px-6 py-3 rounded-xl shadow-2xl shadow-amber-900/50">
            <div className="text-xs tracking-widest uppercase text-amber-400 mb-1">Level Up!</div>
            <div className="text-2xl font-extrabold text-amber-100">Level {levelUpNotice}</div>
            <div className="text-xs text-amber-300 mt-1">HP vollständig wiederhergestellt</div>
          </div>
        </div>
      )}
      {saveNotice && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50
          bg-stone-900/80 border border-amber-600/60 text-amber-300 text-xs font-mono
          px-4 py-2 rounded shadow-lg animate-fade-in">
          Spielstand geladen
        </div>
      )}
      <DialogBox
        isOpen={dialog !== null}
        npcName={dialog?.npcName ?? ''}
        lines={dialog?.lines ?? []}
        onClose={closeDialog}
      />
      <GameOverScreen isOpen={gameOver} />
    </div>
  );
}
