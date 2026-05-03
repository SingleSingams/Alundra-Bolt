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
  MinimapData,
} from '../game/constants';
import { SoundSystem } from '../game/SoundSystem';
import { SettingsSystem, Settings } from '../game/SettingsSystem';
import { HUD } from './HUD';
import { DialogBox } from './DialogBox';
import { GameOverScreen } from './GameOverScreen';
import { PauseMenu } from './PauseMenu';
import { TouchControls } from './TouchControls';
import { LoadingScreen } from './LoadingScreen';

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
  const [minimapData, setMinimapData] = useState<MinimapData | null>(null);
  const [shieldCharges, setShieldCharges] = useState(0);
  const [paused, setPaused] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => SettingsSystem.load());
  const [loadProgress, setLoadProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const handleSettingsChange = useCallback((s: Settings) => {
    setSettings(s);
    SettingsSystem.save(s);
    SoundSystem.setVolume(s.volume);
  }, []);

  // Apply initial volume on mount
  useEffect(() => {
    SoundSystem.setVolume(settings.volume);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const handleMinimapUpdate = useCallback((data: MinimapData) => setMinimapData(data), []);
  const handleLoadProgress = useCallback((v: number) => setLoadProgress(v), []);
  const handleLoadComplete = useCallback(() => setLoaded(true), []);

  const handleShieldChange = useCallback((charges: number) => setShieldCharges(charges), []);

  const handleUsePotion = useCallback(() => {
    gameRef.current?.events.emit(GAME_EVENTS.USE_POTION);
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
    game.events.on(GAME_EVENTS.MINIMAP_UPDATE, handleMinimapUpdate);
    game.events.on(GAME_EVENTS.LOADING_PROGRESS, handleLoadProgress);
    game.events.on(GAME_EVENTS.LOADING_COMPLETE, handleLoadComplete);
    game.events.on(GAME_EVENTS.SHIELD_CHANGE, handleShieldChange);

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
      game.events.off(GAME_EVENTS.MINIMAP_UPDATE, handleMinimapUpdate);
      game.events.off(GAME_EVENTS.LOADING_PROGRESS, handleLoadProgress);
      game.events.off(GAME_EVENTS.LOADING_COMPLETE, handleLoadComplete);
      game.events.off(GAME_EVENTS.SHIELD_CHANGE, handleShieldChange);
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
    handleMinimapUpdate,
    handleLoadProgress,
    handleLoadComplete,
    handleShieldChange,
  ]);

  // ESC key → pause toggle (skip during game over)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !gameOver) {
        setPaused(p => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameOver]);

  // Sync pause state to Phaser scene
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    if (paused) {
      game.scene.pause('MainScene');
    } else {
      game.scene.resume('MainScene');
    }
  }, [paused]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {/* Vignette */}
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
        minimapData={minimapData}
        showHints={settings.showHints}
        shieldCharges={shieldCharges}
        onUsePotion={handleUsePotion}
      />
      {settings.showTouchControls && <TouchControls />}
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
      <GameOverScreen isOpen={gameOver} level={level} xp={xp} zone={zone} />
      {!loaded && <LoadingScreen progress={loadProgress} />}
      <PauseMenu
        isOpen={paused && !gameOver}
        onResume={() => setPaused(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
