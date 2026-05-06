import { LevelUpSkill, SKILL_SYNERGIES } from '../game/constants';

const SKILL_META: Record<LevelUpSkill, { label: string; desc: string; icon: string; color: string }> = {
  hp_up:       { label: 'Lebenskraft',   desc: '+2 max. Herzen sofort geheilt',        icon: '❤️', color: 'border-red-500/60 bg-red-950/60 hover:bg-red-900/60' },
  attack_up:   { label: 'Schärfe',       desc: '+2 Nahkampfschaden dauerhaft',         icon: '⚔️', color: 'border-amber-500/60 bg-amber-950/60 hover:bg-amber-900/60' },
  shield:      { label: 'Schutzschild',  desc: '1 Trefferblock sofort',                icon: '🛡️', color: 'border-blue-500/60 bg-blue-950/60 hover:bg-blue-900/60' },
  xp_boost:    { label: 'Wissensschub',  desc: '+20 XP sofort',                        icon: '✨', color: 'border-yellow-400/60 bg-yellow-950/60 hover:bg-yellow-900/60' },
  speed_up:    { label: 'Eile',          desc: 'Bewegung dauerhaft +15%',              icon: '💨', color: 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60' },
  double_shot: { label: 'Doppelschuss',  desc: 'Schießt immer 2 Projektile (±12°)',    icon: '🎯', color: 'border-orange-500/60 bg-orange-950/60 hover:bg-orange-900/60' },
  vampire:     { label: 'Lebensraub',    desc: 'Treffer heilt +1 HP (max. alle 3s)',   icon: '🧛', color: 'border-purple-500/60 bg-purple-950/60 hover:bg-purple-900/60' },
  dash:        { label: 'Ausweichrolle', desc: 'Shift: 300ms Unvwnd. + Dash (8s CD)', icon: '💫', color: 'border-cyan-500/60 bg-cyan-950/60 hover:bg-cyan-900/60' },
};

function getSynergyBadge(skill: LevelUpSkill, chosen: LevelUpSkill[]): string | null {
  const tentative = [...chosen, skill];
  for (const syn of SKILL_SYNERGIES) {
    const needed = [...syn.requires];
    const available = [...tentative];
    let matched = true;
    for (const req of needed) {
      const idx = available.indexOf(req);
      if (idx === -1) { matched = false; break; }
      available.splice(idx, 1);
    }
    if (matched) return syn.label;
  }
  return null;
}

interface Props {
  level: number;
  skills: LevelUpSkill[];
  chosen: LevelUpSkill[];
  onChoose: (skill: LevelUpSkill) => void;
}

export function SkillChoiceScreen({ level, skills, chosen, onChoose }: Props) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm space-y-5 text-center">
        <div>
          <p className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
            Level {level} erreicht!
          </p>
          <h2 className="text-2xl font-bold font-mono text-amber-100 mt-1">
            Wähle eine Fähigkeit
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {skills.map(skill => {
            const m = SKILL_META[skill];
            const synergy = getSynergyBadge(skill, chosen);
            return (
              <button
                key={skill}
                onClick={() => onChoose(skill)}
                className={[
                  'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border',
                  'text-left transition-all duration-150 active:scale-95',
                  m.color,
                ].join(' ')}
              >
                <span className="text-3xl leading-none">{m.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white font-mono">{m.label}</div>
                  <div className="text-xs text-stone-300 mt-0.5">{m.desc}</div>
                  {synergy && (
                    <div className="mt-1 inline-flex items-center gap-1 bg-yellow-500/20 border border-yellow-400/50 rounded px-1.5 py-0.5">
                      <span className="text-[9px] text-yellow-300 font-mono font-bold tracking-wide">⚡ SYNERGIE: {synergy}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
