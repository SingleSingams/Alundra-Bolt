import { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { createGameConfig } from '../game/GameConfig';
import {
  GAME_EVENTS,
  MAX_HP,
  InventoryItem,
  ZoneId,
  DialogPayload,
} from '../game/constants';
import { HUD } from './HUD';
import { DialogBox } from './DialogBox';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hp, setHp] = useState(MAX_HP);
  const [isJumping, setIsJumping] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [zone, setZone] = useState<ZoneId>('grasslands');
  const [dialog, setDialog] = useState<DialogPayload | null>(null);

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

    return () => {
      game.events.off(GAME_EVENTS.HP_CHANGE, handleHpChange);
      game.events.off(GAME_EVENTS.PLAYER_JUMP, handleJump);
      game.events.off(GAME_EVENTS.PLAYER_LAND, handleLand);
      game.events.off(GAME_EVENTS.INVENTORY_CHANGE, handleInventoryChange);
      game.events.off(GAME_EVENTS.ZONE_CHANGE, handleZoneChange);
      game.events.off(GAME_EVENTS.DIALOG_OPEN, handleDialogOpen);
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
      />
      <DialogBox
        isOpen={dialog !== null}
        npcName={dialog?.npcName ?? ''}
        lines={dialog?.lines ?? []}
        onClose={closeDialog}
      />
    </div>
  );
}
