import { ZoneId } from './constants';

/**
 * "Das Lied von Aelindra" — the complete story script.
 *
 * Premise: 100 years ago the knight Arthos, First Shield of Aelindra, sealed
 * the Void — but the seal demanded a warden, and he stayed behind. The Void
 * slowly ate his memories; what remained became the "Void Tyrant". Only Mira,
 * his sister (kept alive by the seal's magic), knows the truth. She sends the
 * young knight Kael east — without telling him everything. Kael finds Arthos'
 * shield in the dungeon, Mira confesses, and in the end victory means
 * releasing the first hero, not slaying a monster.
 *
 * Act structure (derived from main-quest flags):
 *   act1 — questKills < 5           (setup, humor, departure)
 *   act2 — shield not yet found     (the world darkens, foreshadowing)
 *   act3 — shield found, boss alive (the truth, march to the finale)
 *   done — boss defeated            (epilogue)
 */

export type StoryStage = 'act1' | 'act2' | 'act3' | 'done';

export function getStoryStage(questKills: number, shieldFound: boolean, bossKilled: boolean): StoryStage {
  if (bossKilled) return 'done';
  if (shieldFound) return 'act3';
  if (questKills >= 5) return 'act2';
  return 'act1';
}

export const HERO_NAME = 'Kael';

// ─── Intro (new game, spoken by Mira) ────────────────────────────────────────

export const INTRO_LINES: string[] = [
  'Da bist du also. Kael, richtig? Du trägst die Rüstung deines Vaters. Sie passt dir noch nicht ganz — das macht nichts. Ihm passte sie anfangs auch nicht.',
  'Hör zu. Im Osten, hinter dem Wald, liegt das alte Verlies. Vor hundert Jahren hat dort ein Held die Leere versiegelt. Jetzt bröckelt das Siegel, und die Schatten kriechen zurück.',
  'Besiege fünf von ihnen im Wald. Zeig ihnen, dass Aelindra noch Zähne hat. Danach sprich wieder mit mir.',
  'Sammle unterwegs Holz, Stein und Kräuter — Elara braut dir Tränke, Torvin schärft dein Schwert. Und sprich mit den Leuten: Manche brauchen Hilfe, manche haben nur schlechte Witze. Beides hält ein Dorf am Leben.',
  '(Leise) Und Kael... komm zurück. Ich habe es satt, Ritter in den Osten zu schicken und nur den Wind zurückzubekommen.',
];

// ─── One-time story beats (first zone entry / key events) ────────────────────

export interface StoryBeat {
  id: string;
  npcName: string;
  portrait?: string;
  lines: string[];
}

/** Kael's inner voice when entering a zone for the first time. */
export const ZONE_ENTRY_BEATS: Partial<Record<ZoneId, StoryBeat>> = {
  forest: {
    id: 'enter_forest',
    npcName: 'Kael',
    lines: [
      'Der Wald riecht nach Regen und altem Harz... und nach etwas, das hier nicht hingehört.',
      'Die Bäume stehen zu still. Als würden sie lauschen.',
      'Fünf Schatten, hat Mira gesagt. Also gut. Für Aelindra.',
    ],
  },
  dungeon: {
    id: 'enter_dungeon',
    npcName: 'Kael',
    lines: [
      'Wer hat diese Steine geschlagen? Diese Bögen, diese Zeichen an den Wänden... das ist das Wappen von Aelindra.',
      'Hierher kam also der Erste Ritter, von dem die Alten erzählen. Und von hier kam er nie zurück.',
      'Warum fühlt sich dieser Ort nicht an wie eine Festung des Feindes... sondern wie etwas, das jemand beschützt hat?',
    ],
  },
  dungeon_interior: {
    id: 'enter_interior',
    npcName: 'Kael',
    lines: [
      'Die Dunkelheit hier ist anders. Sie drückt nicht. Sie... trauert.',
      'Irgendwo weit vorn summt etwas. Eine Melodie. Ich kenne sie — Lina hat sie im Wald gesummt.',
      'Was, wenn das hier kein Bau eines Feindes ist — sondern ein Grab, in dem noch jemand wohnt?',
    ],
  },
};

/** Shown right after the shield fragment is found. */
export const SHIELD_REVELATION: StoryBeat = {
  id: 'shield_revelation',
  npcName: 'Kael',
  lines: [
    'Ein Schild. Alt, schwer, unzerbrochen — und die Gravur ist noch klar: A·R·T·H·O·S.',
    'Arthos? Der Erste Schild von Aelindra? Der Held aus den Geschichten?',
    'Warum liegt das Schild des größten Helden aller Zeiten... tief in der Festung des Feindes?',
    'Mira. Sie hat gewusst, dass es hier ist. Sie weiß mehr. Sie hat es IMMER gewusst.',
  ],
};

// ─── Stage-dependent NPC dialog overrides ────────────────────────────────────
// Missing stages fall back to the NPC's base lines in ZoneConfigs.

export const STORY_NPC_LINES: Record<string, Partial<Record<StoryStage, string[]>>> = {
  mira: {
    act2: [
      'Fünf Schatten weniger. Die Leute lachen wieder — Magnus hat sogar eine Runde ausgegeben. Das tut er sonst NIE, Kael. Du hast Geschichte geschrieben.',
      'Aber der Ursprung liegt tiefer. Im Verlies, hinter dem Wald. Dort findest du ein Schild — nimm es. Es wird dich schützen wie keinen Ritter zuvor.',
      'Woher ich das weiß? ... Alte Frauen wissen Dinge. Geh jetzt. Und Kael — was immer du dort unten findest: Urteile nicht zu schnell.',
    ],
    act3: [
      'Du hast es gefunden. Zeig es mir. (Ihre Hände zittern, als sie die Gravur berührt.) Arthos. Mein Bruder.',
      'Vor hundert Jahren zog er aus, die Leere zu versiegeln. Und er hat es GESCHAFFT, Kael. Er hat gewonnen. Aber das Siegel verlangte einen Wächter — und mein Bruder blieb, damit wir leben können.',
      'Die Leere hat ihn nicht getötet. Sie hat ihn vergessen lassen. Stück für Stück. Seinen Namen. Das Dorf. Mich. Was übrig blieb, nennt ihr heute den Leere-Tyrannen.',
      'Ich hätte es dir sagen müssen. Aber wie sagt man einem jungen Ritter: „Geh und töte den größten Helden, den dieses Dorf je hatte"?',
      'Das Siegel hält durch ein Lied — mein Lied. Ich sang es ihm, als wir Kinder waren. Es ist das Einzige, was er nie vergessen hat. Lina summt es bis heute, ohne zu wissen, woher es kommt.',
      'Erlöse ihn, Kael. Nicht für uns — für IHN. Und wenn du ihm gegenüberstehst: Zeig ihm das Schild.',
    ],
    done: [
      'Es ist vorbei. Zum ersten Mal seit hundert Jahren ist die Stille im Osten eine gute Stille.',
      'Ich habe das Schild in die große Halle gehängt. Er hätte gesagt, das sei zu viel Aufhebens. Er hätte sich geirrt.',
      'Danke, Kael. Von mir. Und von ihm.',
    ],
  },
  guard: {
    act3: [
      'Mira hat es uns gesagt. Allen. Der Tyrann ist... Arthos. DER Arthos. Ich bewache ein Dorf, das hundert Jahre lang von einem Helden bewacht wurde, den wir für ein Monster hielten.',
      '(Er atmet tief durch.) Keine Witze heute, Kael.',
      'Bring ihn heim. Egal in welcher Form.',
    ],
  },
  magnus: {
    act3: [
      'Mein Großvater hat Arthos noch gekannt. Er sagte immer: „Der Junge hat zu viel versprochen — und alles gehalten."',
      'Das Bier steht kalt, Kael. Zwei Krüge.',
      'Einer davon war schon immer für ihn reserviert. Hundert Jahre lang. Frag nicht, wie oft ich ihn nachgeschenkt habe.',
    ],
  },
  lina: {
    act3: [
      'Du siehst traurig aus. Hier — ich singe dir das Lied vor. (Sie summt, leise und schief und wunderschön.)',
      'Die alte Frau hat geweint, als sie es mir beigebracht hat. Sie dachte, ich merke es nicht. Ich merke alles.',
      'Sing es ihm vor, wenn du ihn triffst. Dem traurigen Schatten. Vielleicht erinnert er sich dann an den Rest.',
    ],
  },
};

// ─── Boss room ───────────────────────────────────────────────────────────────

export const BOSS_INTRO: StoryBeat = {
  id: 'boss_intro',
  npcName: 'Der Leere-Tyrann',
  portrait: 'assets/portraits/void-tyrant.png',
  lines: [
    '...ein Ritter. Wieder ein Ritter. Sie schicken immer wieder Ritter, und ich weiß nicht mehr, warum ich sie fortschicke, statt sie zu zerbrechen.',
    'Was trägst du da. WAS TRÄGST DU DA. Dieses Schild — ich kenne dieses Schild.',
    'Nein. Nein. Es gehört IHM. Und er ist fort. Er ist seit hundert Jahren fort. ICH bin, was blieb.',
    'Komm, kleiner Ritter. Die Leere hat Platz für uns beide.',
  ],
};

/** Emitted by Boss.ts at phase 3. */
export const BOSS_PHASE3_LINE = 'Das Lied... es hört nicht auf... HÖR AUF ZU SINGEN...';

/** Shown after the boss falls, before the victory screen. */
export const ARTHOS_FAREWELL: StoryBeat = {
  id: 'arthos_farewell',
  npcName: 'Arthos',
  portrait: 'assets/portraits/void-tyrant.png',
  lines: [
    '(Die Schatten fallen ab wie Asche. Darunter: eine alte Rüstung. Auf der Brust, kaum noch lesbar — das Wappen von Aelindra.)',
    '...das Lied. Ich erinnere mich an das Lied. Mira sang es, wenn ich Angst hatte. Ich hatte... so lange Angst.',
    'Du trägst mein Schild, kleiner Ritter. Trag es besser als ich: Trag es nach Hause.',
    'Sag meiner Schwester, der Wächter darf jetzt schlafen. Und... danke, Ritter.',
    'Es tut nicht mehr weh.',
  ],
};

// ─── Epilogue (victory screen) ───────────────────────────────────────────────

export const EPILOGUE_TITLE = 'Das Lied verklingt';

export const EPILOGUE: string[] = [
  'Die Leere zerfiel zu Asche, und zum ersten Mal seit hundert Jahren war die Dunkelheit im Osten nur noch: Nacht.',
  'Kael trug das Schild zurück nach Aelindra. Mira nahm es mit zitternden Händen entgegen — und lächelte, während sie weinte. An diesem Abend sang das ganze Dorf ein altes Lied, und niemand fragte, woher es kam.',
  'Das Schild des Arthos hängt heute in der großen Halle. Darunter steht, in einfacher Schrift:',
  '„Helden besiegen die Dunkelheit nicht. Sie tragen sie — damit andere es nicht müssen."',
];

export const EPILOGUE_NG_PLUS_HINT = 'Doch tief unter den Trümmern des Verlieses regt sich etwas Neues...';

// ─── Game over flavor ────────────────────────────────────────────────────────

export const GAME_OVER_FLAVOR = 'Auch Arthos fiel, bevor er stand. Steh wieder auf, Ritter.';
