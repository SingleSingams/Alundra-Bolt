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
        lines: [
          'Willkommen in Aelindra, Reisender! Ich führe die Apotheke hier drüben.',
          'Meine Kräuter heilen viele Wunden — aber gegen das Böse im Osten helfen nur Mut und ein gutes Schwert.',
          'Sprich mit Mira auf dem Dorfplatz. Sie weiß mehr als wir alle zusammen.',
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
          'Ah, ein Fremder. Die Taverne ist geöffnet, falls du rasten willst.',
          'Aber wenn du weiterreist — der Wald im Osten ist verflucht. Das sage ich aus Erfahrung.',
          'Werde stark. Besiege Bestien. Öffne Truhen. Nur so hast du eine Chance gegen das, was in der Tiefe wartet.',
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
          'Willkommen in Aelindra, dem letzten friedlichen Ort vor dem Dunkel.',
          'Dieses Dorf steht seit hundert Jahren — aber die Schatten werden jeden Tag näher.',
          'Im Wald östlich gibt es eine versteckte Wand. Dahinter liegt, was du brauchst. Such danach.',
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
          'Halt! ... Oh, kein Feind. Entschuldige, bin etwas angespannt.',
          'Ich bewache seit Wochen den Dorfeingang. Letzte Nacht sah ich Schatten aus dem Wald kommen.',
          'Wenn du nach Osten reist — pass auf. Und komm lebend zurück.',
        ],
      },
      {
        id: 'merchant',
        name: 'Händler Aldric',
        spriteKey: 'npc-old-pilgrim',
        portrait: 'assets/portraits/explorer.png',
        x: cx + 160,
        y: cy + 30,
        lines: [
          'Guten Tag! Aldrics Markt — alles was das Abenteurer-Herz begehrt!',
          'Leider... verkaufe ich gerade nichts. Die Lieferungen kommen nicht mehr durch den Wald.',
          'Wenn du dort nach dem Rechten siehst, wäre ich dir sehr dankbar.',
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
          'Dieser Wald ist in letzter Zeit düster geworden... die Schatten regen sich mit etwas Uraltem.',
          'Ich habe Schreie jenseits der Verlies-Tore gehört. Kehr um, solange du noch kannst.',
          'Wenn du darauf bestehst — finde jedes Schwertupgrade, das du kannst. Du wirst es brauchen.',
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
          'H-hallo? Bitte erschreck mich nicht... ich habe mich hier verlaufen.',
          'Da drüben... ich habe ein kleines Monster gesehen. Es hatte Flügel und rote Augen!',
          'Sei vorsichtig, bitte. Ich will, dass du heil zurückkommst.',
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
          '...höre meine Warnung... Ich wagte mich hinein und entkam nur knapp mit dem Leben.',
          'Hinter diesem Tor liegt ein Labyrinth — und tiefer darin wartet etwas Schreckliches.',
          'Der Leere-Tyrann... uralt, unerbittlich. Überlebе zuerst das Innere. Dann stell dich deinem Schicksal.',
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
    ],
    heartSpawns: [{ tx: 30, ty: 30 }],
    hazardSpawns: [
      { tx: 20, ty: 20, kind: 'thorns' }, { tx: 21, ty: 20, kind: 'thorns' },
      { tx: 39, ty: 20, kind: 'thorns' }, { tx: 40, ty: 20, kind: 'thorns' },
      { tx: 20, ty: 40, kind: 'thorns' }, { tx: 21, ty: 40, kind: 'thorns' },
      { tx: 39, ty: 40, kind: 'thorns' }, { tx: 40, ty: 40, kind: 'thorns' },
      { tx: 30, ty: 26, kind: 'thorns' }, { tx: 30, ty: 34, kind: 'thorns' },
    ],
    npcs: [],
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
