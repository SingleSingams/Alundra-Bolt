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

// ─── Side quests ─────────────────────────────────────────────────────────────
// Each side quest is a small self-contained story. Dialog states:
//   offer  — spoken by the giver when the quest activates (first talk)
//   active — reminder while in progress (optional; crafters open their
//            crafting screen instead)
//   done   — spoken once by the giver after completion (the payoff)
//   target — for talk_npc quests: what the TARGET says at the delivery moment

export type SideQuestKind =
  | 'gather_herb'
  | 'gather_wood'
  | 'gather_ore'
  | 'gather_essence'
  | 'kill_dragon'
  | 'kill_any'
  | 'talk_npc';

export type SideQuestRewardItem = 'potion' | 'shield_charge' | 'sword_upgrade' | 'heal_full';

export interface SideQuestDef {
  id: string;
  /** NPC id that hands out the quest (see ZoneConfigs npcs). */
  giver: string;
  title: string;
  desc: string;
  goal: number;
  kind: SideQuestKind;
  /** For talk_npc quests: the NPC to deliver the message to. */
  targetNpc?: string;
  rewardXp: number;
  rewardItem?: SideQuestRewardItem;
  rewardLabel: string;
  offerLines: string[];
  activeLines?: string[];
  doneLines: string[];
  targetLines?: string[];
}

export const SIDE_QUESTS: SideQuestDef[] = [
  {
    id: 'elara_herbs',
    giver: 'elara',
    title: 'Elaras Vorräte',
    desc: 'Sammle 3 Kräuter für die Apothekerin.',
    goal: 3,
    kind: 'gather_herb',
    rewardXp: 12,
    rewardItem: 'potion',
    rewardLabel: '+12 XP & Heiltrank',
    offerLines: [
      'Bevor du fragst: Ja, ich braue dir Tränke. Aber meine Regale sind so leer wie Brams Kopf um Mitternacht.',
      'Die Leere frisst zuerst die Kräuter, weißt du. Als hätte sie Angst vor dem, was heilt.',
      'Bring mir 3 Kräuter aus der Wildnis — die Beerensträucher, du erkennst sie am Glitzern. Der erste Trank geht dann aufs Haus.',
    ],
    doneLines: [
      'Frisch! Endlich wieder frische Kräuter. Riech mal! ... Na gut, du hast einen Helm auf. Glaub mir einfach.',
      'Hier, dein Trank — wie versprochen.',
      'Und sag Magnus, er soll aufhören, meine Medizin „Hexenwasser" zu nennen. Sein Kräuterschnaps ist auch nur Hexenwasser mit schlechterem Ruf.',
    ],
  },
  {
    id: 'bram_dragons',
    giver: 'guard',
    title: 'Brams Sorge',
    desc: 'Besiege 2 Drachen für den Dorfwächter.',
    goal: 2,
    kind: 'kill_dragon',
    rewardXp: 30,
    rewardItem: 'shield_charge',
    rewardLabel: '+30 XP & Schild-Ladung',
    offerLines: [
      'Kael, hör zu. Im tiefen Verlies sind DRACHEN. Echte. Ich habe sie gehört. Na gut — Theron hat sie gehört und mir davon erzählt. Aber ich habe SEHR aufmerksam zugehört.',
      'Die Leute lachen über mich und meine Schatten. Aber wenn ein Drache kommt, lacht keiner mehr.',
      'Besiege zwei von ihnen, und ich kann nachts wieder atmen. Und vielleicht... hören die Leute auf zu lachen.',
    ],
    activeLines: [
      'Die Drachen, Kael. Tief im Verlies. Ich zähle hier oben derweil die Schatten. Aktueller Stand: 41. Es werden MEHR.',
    ],
    doneLines: [
      'Du hast sie WIRKLICH erlegt? Zwei? DRACHEN?',
      '(Er richtet sich auf. Zum ersten Mal, seit du ihn kennst, wirkt er nicht nervös.) Weißt du was? Sollen sie doch über meine 37 Schatten lachen. MEIN Ritter erlegt Drachen.',
      'Hier — meine Ersatz-Schildladung. Ich glaube, du brauchst sie nötiger als ich. Ich habe ja jetzt dich.',
    ],
  },
  {
    id: 'magnus_table',
    giver: 'magnus',
    title: 'Der Stammtisch des Helden',
    desc: 'Bring Magnus 4 Holz für den wackelnden Stammtisch.',
    goal: 4,
    kind: 'gather_wood',
    rewardXp: 15,
    rewardItem: 'heal_full',
    rewardLabel: '+15 XP & Freibier (volle Heilung)',
    offerLines: [
      'Kael! Du siehst kräftig aus. Und du gehst sowieso dauernd in den Wald, oder? Mein Stammtisch — das dritte Bein ist hinüber.',
      'Das ist nicht irgendein Tisch. An dem Tisch saß Arthos, bevor er in den Osten zog. Sein Name ist unten reingeschnitzt. Falsch geschrieben, aber reingeschnitzt.',
      'Bring mir 4 Holz, und ich zimmere das Bein neu. Der Tisch übersteht mich noch — das schwöre ich dir.',
    ],
    activeLines: [
      'Der Tisch wackelt noch, Kael. Vier Stück Holz. Die alten Stümpfe im Wald geben das beste her.',
      'Ich habe ein Bierfass druntergestellt. Als Stütze. Es ist eine Tragödie in jeder Hinsicht.',
    ],
    doneLines: [
      'HA! Sieh ihn dir an. Stabil wie ein Fels. Da kann sich eine ganze Abenteurergruppe draufstellen. Bitte nicht draufstellen.',
      'Weißt du... als ich klein war, sagte mein Großvater immer: „Solange der Tisch steht, kommt er zurück."',
      '(Er wischt sich etwas aus dem Auge.) Staub. Nur Staub. Dein Bier steht auf dem Tisch, Ritter. Es geht aufs Haus.',
    ],
  },
  {
    id: 'torvin_horseshoe',
    giver: 'torvin',
    title: 'Das Glückseisen',
    desc: 'Bring Torvin 3 Erz aus dem Verlies.',
    goal: 3,
    kind: 'gather_ore',
    rewardXp: 20,
    rewardItem: 'sword_upgrade',
    rewardLabel: '+20 XP & geschärftes Schwert',
    offerLines: [
      'Mein Urgroßvater hat Arthos\' Schild geschmiedet. Wusstest du das? DIESE Esse. DIESER Amboss.',
      'Er gab ihm damals auch ein Glückseisen mit — ein Hufeisen aus Verlies-Erz. „Damit der Junge heimfindet", hat er gesagt. (Pause.) Hat nicht funktioniert.',
      'Bring mir 3 Erz aus dem Verlies. Ich schmiede ein neues. Diesmal... diesmal findet einer heim.',
    ],
    doneLines: [
      'Es ist fertig. Hörst du, wie es klingt? Wie eine Glocke.',
      'Mein Urgroßvater hätte geheult vor Freude. Ich heule NICHT. Das ist Funkenflug im Auge. Schmiede haben ständig Funkenflug im Auge.',
      'Ich habe dir dabei auch gleich die Klinge nachgezogen. Nimm beides mit, Kael. Und finde heim.',
    ],
  },
  {
    id: 'finn_grove',
    giver: 'finn',
    title: 'Gerhard in Gefahr',
    desc: 'Vertreibe 4 Schattenwesen aus Finns Wald.',
    goal: 4,
    kind: 'kill_any',
    rewardXp: 15,
    rewardItem: 'potion',
    rewardLabel: '+15 XP & Waldbeeren-Trank',
    offerLines: [
      'Kael! Ein Notfall. Die Schatten-Viecher wetzen ihre Krallen an meinen Bäumen. An GERHARD, Kael.',
      'Gerhard ist 300 Jahre alt. Er hat den großen Sturm überlebt, zwei Blitzeinschläge und eine sehr aggressive Spechtfamilie. Er wird NICHT als Kratzbaum enden.',
      'Vertreib 4 von diesen Biestern. Für den Wald. Für Gerhard.',
    ],
    activeLines: [
      'Ich höre sie noch kratzen, Kael. Gerhard verliert Rinde. RINDE, Kael!',
    ],
    doneLines: [
      'Still. Hörst du? Kein Kratzen. Nur Wind und Vögel und Gerhards Blätter.',
      'Er sieht schon besser aus. Ich glaube, er nickt dir zu. Das macht er sonst nie bei Fremden.',
      'Du hast einen Freund fürs Leben, Ritter. Er ist ein Baum — aber die besten Freunde reden einem sowieso nicht dazwischen. Hier, ein Trank aus seinen Beeren. Er besteht darauf.',
    ],
  },
  {
    id: 'soldier_letter',
    giver: 'soldier',
    title: 'Worte für Selin',
    desc: 'Überbringe Selin im Verlies die Nachricht ihres Bruders.',
    goal: 1,
    kind: 'talk_npc',
    targetNpc: 'selin',
    rewardXp: 25,
    rewardItem: 'potion',
    rewardLabel: '+25 XP & Trank',
    offerLines: [
      'Warte. Bevor du weitergehst — im Verlies ist eine Frau gefangen. Selin. Sie... sie ist meine Schwester, Kael.',
      'Ich bin weggerannt und habe sie ZURÜCKGELASSEN. Ich kann ihr nicht unter die Augen treten. Nicht so.',
      'Aber wenn du sie siehst: Sag ihr, dass ich lebe. Sag ihr, es tut mir leid. Bitte.',
    ],
    activeLines: [
      'Selin. Im Verlies. Bitte, Kael. Jeden Tag, den sie es nicht weiß, ist ein Tag zu viel.',
    ],
    doneLines: [
      'Du hast sie gesehen? Und sie... (Er setzt sich hin. Einfach so, mitten auf den Boden.)',
      'Nicht böse. Sie ist nicht böse.',
      'Wenn das hier vorbei ist, hole ich sie da raus. Und dann laufe ich nie wieder weg. Danke, Kael. Hier — meinen Feldtrank. Ich brauche ihn nicht mehr, um zu schlafen.',
    ],
    targetLines: [
      '...er lebt? ER LEBT? (Sie lacht und weint gleichzeitig.) Dieser IDIOT. Dieser wunderbare, feige Idiot.',
      'Sag ihm: Ich bin nicht böse. Weggerannt ist nur, wer weiß, wohin er gehört.',
      'Danke, Ritter. Heute Nacht schlafe ich zum ersten Mal seit Wochen.',
    ],
  },
  {
    id: 'yara_light',
    giver: 'survivor-mage',
    title: 'Licht im Dunkel',
    desc: 'Bring Yara 3 Essenzen für ihren Schutzzauber.',
    goal: 3,
    kind: 'gather_essence',
    rewardXp: 25,
    rewardItem: 'shield_charge',
    rewardLabel: '+25 XP & Schild-Ladung',
    offerLines: [
      'Mein Schutzzauber flackert. Er braucht Essenz — die Funken, die die Schatten hinterlassen, wenn sie fallen.',
      'Ironisch, nicht? Das Dunkel liefert das Licht, das uns vor ihm schützt. Fast, als wollte ein Teil von ihm, dass wir bleiben.',
      'Drei Essenzen, Ritter. Für alle, die hier unten noch atmen.',
    ],
    doneLines: [
      'Sieh nur. Der Zauber — er ist heller. Er hält jetzt. Monate, wenn es sein muss.',
      'Die Verletzten hier unten... du hast ihnen Zeit gekauft. Zeit ist das Kostbarste, was man einem Menschen geben kann.',
      'Geh jetzt. Beende es. Und Ritter — das Herz, das ich schlagen hörte? Es schlägt ruhiger, seit du hier bist. Nimm diesen Schildzauber. Er gehörte einem, der ihn nicht mehr braucht.',
    ],
  },
];
