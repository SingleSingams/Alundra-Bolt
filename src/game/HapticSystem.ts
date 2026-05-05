export const HapticSystem = {
  hit()    { navigator.vibrate?.(30); },
  death()  { navigator.vibrate?.([50, 30, 80]); },
  levelUp(){ navigator.vibrate?.([100, 50, 100, 50, 200]); },
  danger() { navigator.vibrate?.([200]); },
};
