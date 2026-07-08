import { PatrolAxis, EnemyType } from './Enemy';
import { NPCDefinition } from './NPC';
import { ZoneId, InventoryItem, WORLD_WIDTH, WORLD_HEIGHT } from './constants';

export type EdgeDirection = 'east' | 'west';
export type HazardType = 'thorns' | 'lava';

export interface ZoneConfig {
  numTrees: number;
  obstacleDensity: number;
  enemySpawns: Array<{ tx: number; ty: number; axis: PatrolAxis; type?: EnemyType }>;
  heartSpawns: Array<{ tx: number; ty: number }>;
  hazardSpawns?: Array<{ tx: number; ty: number; kind: HazardType }>;
  npcs: NPCDefinition[];
  transitions: Partial<Record<EdgeDirection, ZoneId>>;
  bossSpawn?: { tx: number; ty: number };
  secretWall?: { tx: number; ty: number; reward: InventoryItem };
}

const cx = WORLD_WIDTH / 2;
const cy = WORLD_HEIGHT / 2;

export const ZONE_CONFIGS: Record<ZoneId, ZoneConfig> = {
  grasslands: {
    numTrees: 16,       // fewer trees — buildings fill the space
    obstacleDensity: 0, // no random rocks — village roads should be clear
    enemySpawns: [],    // peaceful village, no monsters
    heartSpawns: [],
    npcs: [
      {
        id: 'elara',
        name: 'Elara die Kräuterkundige',
        spriteKey: 'npc-innkeeper-woman',
        portrait: 'assets/portraits/innkeeper.png',
        x: cx - 155,
        y: cy + 20,
        station: 'alchemy',
        lines: [
          'Willkommen in Aelindra, Reisender! Ich führe die Apotheke hier drüben.',
          'Bring mir Kräuter aus der Wildnis, dann braue ich dir Tränke und Elixiere.',
        ],
      },
      {
        id: 'torvin',
        name: 'Schmied Torvin',
        spriteKey: 'npc-old-explorer',
        portrait: 'assets/portraits/explorer.png',
        x: cx - 165,
        y: cy + 185,
        station: 'forge',
        lines: [
          'Erz und Holz, Ritter — bring mir Erz und Holz, und ich mache dein Schwert schärfer als das Schicksal.',
        ],
      },
      {
        id: 'magnus',
        name: 'Alter Magnus',
        spriteKey: 'npc-old-explorer',
        portrait: 'assets/portraits/explorer.png',
        x: cx - 100,
        y: cy - 120,
        lines: [
          'Ah, der neue Ritter! Ich hatte auch mal ein Schwert. Dann kam der Rücken.',
          'Ein Rat vom alten Magnus: Ein Held ohne Frühstück ist nur ein trauriger Mann in Metall.',
          'Komm lebend wieder, dann geht das erste Bier aufs Haus. Das zweite nicht. Ich bin alt, nicht großzügig.',
        ],
      },
      {
        id: 'mira',
        name: 'Mira die Dorfälteste',
        spriteKey: 'npc-elder-woman',
        portrait: 'assets/portraits/elder-woman.png',
        x: cx + 20,
        y: cy + 10,
        lines: [
          'Kael. Gut, dass du da bist. Die Schatten im Osten werden dreister — gestern haben sie Brams Wäsche von der Leine gestohlen. Er behauptet, es war der Wind. Der Wind trägt keine Unterhosen, Kael.',
          'Besiege fünf von ihnen im Wald, damit die Leute wieder schlafen können. Danach reden wir weiter.',
          'Und sei vorsichtig. Ich habe schon einmal jemanden in diesen Osten geschickt. (Sie schaut weg.) Geh jetzt.',
        ],
      },
      {
        id: 'guard',
        name: 'Dorfwächter Bram',
        spriteKey: 'npc-young-man',
        portrait: 'assets/portraits/boy-npc.png',
        portraitColumns: 4,
        x: cx + 200,
        y: cy - 180,
        lines: [
          'Halt! Wer da?! ... Oh. Kael. Entschuldige. Ich habe heute Nacht 37 Schatten gezählt. Einer davon war meiner, aber die anderen 36 waren ECHT.',
          'Mira sagt, ich soll weniger Kaffee trinken. Ich sage, die Schatten sollen weniger huschen. Wort gegen Wort.',
          'Wenn du in den Wald gehst: Drachen mögen keine spitzen Gegenstände. Sagt mein Großvater. Er hatte nur noch ein Bein, aber SEHR feste Meinungen.',
        ],
      },
      {
        id: 'merchant',
        name: 'Händler Aldric',
        spriteKey: 'npc-old-pilgrim',
        portrait: 'assets/portraits/explorer.png',
        x: cx + 160,
        y: cy + 30,
        isShop: true,
        lines: [
          'Eure Entschlossenheit hat mein Lager aufgetaut. Was braucht Ihr?',
        ],
      },
    ],
    transitions: { east: 'forest' },
    secretWall: { tx: 8, ty: 38, reward: 'sword_upgrade' },
  },
  forest: {
    numTrees: 90,
    obstacleDensity: 0.08,
    enemySpawns: [
      { tx: 14, ty: 20, axis: 'x' },
      { tx: 44, ty: 22, axis: 'y' },
      { tx: 22, ty: 44, axis: 'x' },
      { tx: 42, ty: 42, axis: 'y' },
      { tx: 30, ty: 14, axis: 'x', type: 'ranger' },
      { tx: 18, ty: 32, axis: 'y', type: 'ranger' },
    ],
    heartSpawns: [
      { tx: 30, ty: 30 },
      { tx: 42, ty: 16 },
    ],
    npcs: [
      {
        id: 'theron',
        name: 'Theron der Wanderer',
        spriteKey: 'npc-young-man',
        portrait: 'assets/portraits/boy-npc.png',
        portraitColumns: 4,
        x: cx - 120,
        y: cy + 80,
        lines: [
          'Ich wandere seit vierzig Jahren durch diesen Wald. Er war nie freundlich. Aber seit einer Weile ist er... höflich. Wie ein Raubtier, das wartet.',
          'Kennst du die Geschichte vom Ersten Ritter? Arthos zog vor hundert Jahren durch genau diesen Wald. Selbe Richtung wie du.',
          'Er kam nie zurück. Aber die Leere blieb hundert Jahre hinter ihren Toren. Erklär mir DAS mal, Ritter.',
        ],
      },
      {
        id: 'lina',
        name: 'Lina, verirrtes Kind',
        spriteKey: 'npc-woman-adventurer',
        portrait: 'assets/portraits/peasant-girl.png',
        x: cx + 140,
        y: cy - 100,
        lines: [
          'Psst! Nicht so laut. Die Bäume erzählen sich hier Geheimnisse, weißt du.',
          '(Sie summt eine Melodie.) Das Lied? Das hat mir die alte Frau im Dorf beigebracht. Es macht die Schatten weicher. Die mögen das, glaube ich.',
          'Du hast ein nettes Gesicht. Versprich, dass du zurückkommst. Die mit den netten Gesichtern kommen nicht immer zurück.',
        ],
      },
      {
        id: 'finn',
        name: 'Waldläufer Finn',
        spriteKey: 'npc-old-explorer',
        portrait: 'assets/portraits/explorer.png',
        x: cx - 60,
        y: cy + 180,
        lines: [
          'Ich kannte hier jeden Baum beim Namen. Der da drüben ist Gerhard.',
          'Gerhard sieht schlecht aus in letzter Zeit. Alle sehen schlecht aus. Sogar die Pilze wirken bedrückt, und Pilze sind normalerweise sehr gefasste Wesen.',
          'Pass im Osten auf dich auf. Und wenn du Gerhard etwas antust, finde ich es heraus.',
        ],
      },
      {
        id: 'soldier',
        name: 'Verwundeter Soldat',
        spriteKey: 'npc-young-man',
        portrait: 'assets/portraits/youngster.png',
        x: cx - 20,
        y: cy + 210,
        lines: [
          'Wir waren zu sechst. Ich bin der, der weggerannt ist.',
          'Die anderen... das Ding hat sie nicht einmal gehasst. Es hat gekämpft wie jemand, der schläft und nicht aufwachen will.',
          'Nenn mich Feigling — ich nenne mich auch so. Aber ich habe gesehen, wie es das Schild eines Toten aufhob und es GEWIEGT hat, Ritter. Wie ein Kind. Geh da nicht rein.',
        ],
      },
    ],
    transitions: { west: 'grasslands', east: 'dungeon' },
    secretWall: { tx: 52, ty: 22, reward: 'potion' },
  },
  dungeon: {
    numTrees: 4,
    obstacleDensity: 0.22,
    enemySpawns: [
      { tx: 18, ty: 20, axis: 'x' },
      { tx: 42, ty: 20, axis: 'y' },
      { tx: 18, ty: 40, axis: 'y', type: 'shielder' },
      { tx: 42, ty: 40, axis: 'x', type: 'shielder' },
      { tx: 30, ty: 30, axis: 'x' },
      { tx: 30, ty: 16, axis: 'y', type: 'ranger' },
      { tx: 14, ty: 30, axis: 'x' },
    ],
    heartSpawns: [{ tx: 30, ty: 46 }],
    hazardSpawns: [
      { tx: 24, ty: 24, kind: 'thorns' }, { tx: 25, ty: 24, kind: 'thorns' },
      { tx: 36, ty: 36, kind: 'thorns' }, { tx: 37, ty: 36, kind: 'thorns' },
      { tx: 24, ty: 36, kind: 'thorns' }, { tx: 36, ty: 24, kind: 'thorns' },
    ],
    npcs: [
      {
        id: 'arwen',
        name: 'Arwen, Gefallene Späher',
        spriteKey: 'npc-old-pilgrim',
        portrait: 'assets/portraits/girl-npc.png',
        portraitColumns: 4,
        x: cx + 80,
        y: cy - 80,
        lines: [
          'Ich habe den Tyrannen gesehen und lebe. Weißt du, warum? Er hat mich angesehen — und dann durch mich hindurch. Als würde er jemand anderen suchen.',
          'Hinter diesem Tor liegt ein Labyrinth, und tiefer darin wartet er.',
          'Geh nur hinein, wenn du bereit bist, das zu finden, was du findest. Das ist nicht dasselbe wie das, was du suchst.',
        ],
      },
      {
        id: 'selin',
        name: 'Gefangene Selin',
        spriteKey: 'npc-elder-woman',
        portrait: 'assets/portraits/elder-woman.png',
        x: cx - 150,
        y: cy + 120,
        lines: [
          'Er sperrt uns ein — aber dann vergisst er uns. Manchmal bringt uns die Dunkelheit Wasser. Frag mich nicht, wie das funktioniert.',
          'Nachts hört man ihn durch die Gänge gehen. Er summt, Ritter. Ein Monster, das summt. Ich habe Angst davor — und manchmal muss ich davon weinen, und ich weiß nicht, warum.',
          'Das Schild im Ostflügel ist echt, hinter der brüchigen Wand. Hol es dir. Und dann beende das hier — so oder so.',
        ],
      },
    ],
    transitions: { west: 'forest', east: 'dungeon_interior' },
    secretWall: { tx: 8, ty: 22, reward: 'shield_fragment' },
  },
  dungeon_interior: {
    numTrees: 0,
    obstacleDensity: 0.28,
    enemySpawns: [
      { tx: 12, ty: 12, axis: 'x', type: 'speedrunner' },
      { tx: 48, ty: 12, axis: 'y', type: 'speedrunner' },
      { tx: 12, ty: 48, axis: 'y' },
      { tx: 48, ty: 48, axis: 'x' },
      { tx: 30, ty: 18, axis: 'x', type: 'shielder' },
      { tx: 18, ty: 30, axis: 'y', type: 'ranger' },
      { tx: 42, ty: 30, axis: 'x', type: 'ranger' },
      { tx: 30, ty: 42, axis: 'y', type: 'speedrunner' },
      { tx: 10, ty: 30, axis: 'y', type: 'dragon' },
      { tx: 50, ty: 30, axis: 'y', type: 'dragon' },
    ],
    heartSpawns: [{ tx: 30, ty: 30 }],
    hazardSpawns: [
      { tx: 20, ty: 20, kind: 'thorns' }, { tx: 21, ty: 20, kind: 'thorns' },
      { tx: 39, ty: 20, kind: 'thorns' }, { tx: 40, ty: 20, kind: 'thorns' },
      { tx: 20, ty: 40, kind: 'thorns' }, { tx: 21, ty: 40, kind: 'thorns' },
      { tx: 39, ty: 40, kind: 'thorns' }, { tx: 40, ty: 40, kind: 'thorns' },
      { tx: 30, ty: 26, kind: 'thorns' }, { tx: 30, ty: 34, kind: 'thorns' },
    ],
    npcs: [
      {
        id: 'wounded-knight',
        name: 'Verwundeter Ritter',
        spriteKey: 'npc-young-man',
        portrait: 'assets/portraits/youngster.png',
        x: cx + 100,
        y: cy - 80,
        lines: [
          'Du bist weit gekommen. Weiter als ich.',
          'Er hätte mich töten können. Stattdessen hat er mein Schild angestarrt — MEIN Schild, ein einfaches Ding aus Eichenholz — und ist einfach gegangen.',
          'Was auch immer dort hinten wartet: Es kämpft nicht gegen dich. Es kämpft gegen etwas in sich. Er teleportiert sich, kurz bevor er zustößt — nutze das. Oder erlöse ihn.',
        ],
      },
      {
        id: 'survivor-mage',
        name: 'Magierin Yara',
        spriteKey: 'npc-woman-adventurer',
        portrait: 'assets/portraits/peasant-girl.png',
        x: cx - 100,
        y: cy + 100,
        lines: [
          'Mein Schutzzauber hält diese Kammer. Er hält, glaube ich, weil das Wesen ihn halten LÄSST. Es will nicht, dass wir sterben. Denk darüber nach.',
          'Die Leere hat kein Herz, sagen die Bücher. Aber ich habe eines schlagen hören, dort hinten. Langsam. Müde. Hundert Jahre müde.',
          'Was auch immer du dort erlöst: Sei sanft dabei, wenn du kannst. Und schnell, wenn du musst.',
        ],
      },
    ],
    transitions: { west: 'dungeon', east: 'boss_room' },
    secretWall: { tx: 52, ty: 42, reward: 'projectile_upgrade' },
  },
  boss_room: {
    numTrees: 0,
    obstacleDensity: 0.08,
    enemySpawns: [
      { tx: 14, ty: 14, axis: 'x', type: 'speedrunner' },
      { tx: 46, ty: 14, axis: 'y', type: 'speedrunner' },
      { tx: 14, ty: 46, axis: 'y', type: 'shielder' },
      { tx: 46, ty: 46, axis: 'x', type: 'shielder' },
      { tx: 10, ty: 30, axis: 'y', type: 'dragon-red' },
      { tx: 50, ty: 30, axis: 'x', type: 'dragon-red' },
    ],
    heartSpawns: [],
    hazardSpawns: [
      { tx: 22, ty: 22, kind: 'lava' }, { tx: 23, ty: 22, kind: 'lava' },
      { tx: 37, ty: 22, kind: 'lava' }, { tx: 38, ty: 22, kind: 'lava' },
      { tx: 22, ty: 38, kind: 'lava' }, { tx: 23, ty: 38, kind: 'lava' },
      { tx: 37, ty: 38, kind: 'lava' }, { tx: 38, ty: 38, kind: 'lava' },
    ],
    npcs: [],
    bossSpawn: { tx: 30, ty: 30 },
    transitions: { west: 'dungeon_interior' },
  },
};
