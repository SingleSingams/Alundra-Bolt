import { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { createGameConfig } from '../game/GameConfig';
import { GAME_EVENTS, MAX_HP } from '../game/constants';
import { HUD } from './HUD';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hp, setHp] = useState(MAX_HP);
  const [isJumping, setIsJumping] = useState(false);

  const handleHpChange = useCallback((newHp: number) => {
    setHp(newHp);
  }, []);

  const handleJump = useCallback(() => setIsJumping(true), []);
  const handleLand = useCallback(() => setIsJumping(false), []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = createGameConfig(containerRef.current);
    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.on(GAME_EVENTS.HP_CHANGE, handleHpChange);
    game.events.on(GAME_EVENTS.PLAYER_JUMP, handleJump);
    game.events.on(GAME_EVENTS.PLAYER_LAND, handleLand);

    return () => {
      game.events.off(GAME_EVENTS.HP_CHANGE, handleHpChange);
      game.events.off(GAME_EVENTS.PLAYER_JUMP, handleJump);
      game.events.off(GAME_EVENTS.PLAYER_LAND, handleLand);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [handleHpChange, handleJump, handleLand]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <HUD hp={hp} maxHp={MAX_HP} isJumping={isJumping} />
    </div>
  );
}
