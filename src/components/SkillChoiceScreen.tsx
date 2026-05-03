import { LevelUpSkill } from '../game/constants';

const SKILL_META: Record<LevelUpSkill, { label: string; desc: string; icon: string; color: string }> = {
  hp_up:     { label: 'Lebenskraft',  desc: '+2 max. Herzen sofort geheilt', icon: '❤️', color: 'border-red-500/60 bg-red-950/60 hover:bg-red-900/60' },
  attack_up: { label: 'Schärfe',      desc: '+2 Nahkampfschaden dauerhaft',  icon: '⚔️', color: 'border-amber-500/60 bg-amber-950/60 hover:bg-amber-900/60' },
  shield:    { label: 'Schutzschild', desc: '1 Trefferblock sofort',         icon: '🛡️', color: 'border-blue-500/60 bg-blue-950/60 hover:bg-blue-900/60' },
  xp_boost:  { label: 'Wissensschub', desc: '+20 XP sofort',                 icon: '✨', color: 'border-yellow-400/60 bg-yellow-950/60 hover:bg-yellow-900/60' },
  speed_up:  { label: 'Eile',         desc: 'Bewegung dauerhaft +15%',       icon: '💨', color: 'border-emerald-500/60 bg-emerald-950/60 hover:bg-emerald-900/60' },
};

interface Props {
  level: number;
  skills: LevelUpSkill[];
  onChoose: (skill: LevelUpSkill) => void;
}

export function SkillChoiceScreen({ level, skills, onChoose }: Props) {
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
                <div>
                  <div className="text-sm font-bold text-white font-mono">{m.label}</div>
                  <div className="text-xs text-stone-300 mt-0.5">{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
