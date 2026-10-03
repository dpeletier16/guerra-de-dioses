export type HeroKind = "aquiles" | "atalanta" | "hercules" | "medea" | "perseo";
export type MonsterKind =
  "minotauro" | "ciclope" | "centimano" | "cerbero" | "cronos";
export type UnitKind = HeroKind | MonsterKind;
export type TowerKind = "flechas" | "fuego" | "magia";
export type Order = "shelter" | "defend" | "attack";
export type ShotKind = "melee" | "arrow" | "fire" | "magic";
export interface Stats {
  name: string;
  health: number;
  damage: number;
  interval: number;
  range: number;
  speed: number;
  cost: number;
  size: number;
  shot: ShotKind;
  role: string;
}
export const HEROES: Record<HeroKind, Stats> = {
  aquiles: {
    name: "Aquiles",
    health: 290,
    damage: 23,
    interval: 1.1,
    range: 48,
    speed: 68,
    cost: 110,
    size: 86,
    shot: "melee",
    role: "Espada y escudo · Resistente",
  },
  atalanta: {
    name: "Atalanta",
    health: 150,
    damage: 17,
    interval: 1.25,
    range: 270,
    speed: 104,
    cost: 95,
    size: 80,
    shot: "arrow",
    role: "Arco · Rápida y a distancia",
  },
  hercules: {
    name: "Hércules",
    health: 480,
    damage: 38,
    interval: 1.65,
    range: 53,
    speed: 55,
    cost: 185,
    size: 104,
    shot: "melee",
    role: "Puños · Fuerza extraordinaria",
  },
  medea: {
    name: "Medea",
    health: 175,
    damage: 22,
    interval: 1.75,
    range: 230,
    speed: 65,
    cost: 160,
    size: 87,
    shot: "fire",
    role: "Bastón · Fuego en área",
  },
  perseo: {
    name: "Perseo",
    health: 245,
    damage: 27,
    interval: 1.25,
    range: 49,
    speed: 90,
    cost: 135,
    size: 86,
    shot: "melee",
    role: "Hoz y escudo · Vanguardia veloz",
  },
};
export const MONSTERS: Record<MonsterKind, Stats> = {
  minotauro: {
    name: "Minotauro",
    health: 250,
    damage: 21,
    interval: 1.4,
    range: 52,
    speed: 57,
    cost: 0,
    size: 106,
    shot: "melee",
    role: "Embestida",
  },
  ciclope: {
    name: "Cíclope",
    health: 390,
    damage: 34,
    interval: 2,
    range: 59,
    speed: 43,
    cost: 0,
    size: 122,
    shot: "melee",
    role: "Golpe pesado",
  },
  centimano: {
    name: "Centímano",
    health: 430,
    damage: 13,
    interval: 2.6,
    range: 68,
    speed: 44,
    cost: 0,
    size: 116,
    shot: "melee",
    role: "Ráfaga de brazos",
  },
  cerbero: {
    name: "Cerbero",
    health: 215,
    damage: 15,
    interval: 0.95,
    range: 49,
    speed: 97,
    cost: 0,
    size: 100,
    shot: "melee",
    role: "Tres cabezas",
  },
  cronos: {
    name: "Cronos",
    health: 760,
    damage: 49,
    interval: 2.35,
    range: 75,
    speed: 38,
    cost: 0,
    size: 140,
    shot: "melee",
    role: "Titán ancestral",
  },
};
export const TOWERS: Record<
  TowerKind,
  {
    name: string;
    cost: number;
    health: number;
    range: number;
    damage: number;
    interval: number;
    shot: ShotKind;
  }
> = {
  flechas: {
    name: "Torre de flechas",
    cost: 85,
    health: 280,
    range: 310,
    damage: 20,
    interval: 1,
    shot: "arrow",
  },
  fuego: {
    name: "Torre de fuego",
    cost: 135,
    health: 250,
    range: 260,
    damage: 32,
    interval: 2.2,
    shot: "fire",
  },
  magia: {
    name: "Torre de magia",
    cost: 115,
    health: 245,
    range: 290,
    damage: 23,
    interval: 1.6,
    shot: "magic",
  },
};
// Valores de producción provisionales: no son decisiones creativas de David.
export const BALANCE = {
  worldWidth: 2400,
  home: 230,
  enemy: 2170,
  ground: 480,
  initialGold: 140,
  initialStone: 45,
  heroLimit: 20,
  enemyLimit: 28,
  doorHealth: 3000,
  mineX: 370,
  miningSeconds: 3.1,
  minerSpeed: 65,
  deliveryGold: 22,
  deliveryStone: 13,
  conversionStone: 60,
  conversionGold: 35,
  refundRatio: 1,
  towerSlots: [470, 650, 830],
  defenseX: 410,
  defenseThreshold: 920,
  firstWave: 25,
  waveInterval: 19,
  minWaveInterval: 9,
  waveAcceleration: 0.025,
  shieldReduction: 0.15,
  splashRadius: 75,
  splashRatio: 0.45,
  slowRatio: 0.55,
  slowSeconds: 2,
  projectileSpeed: 520,
  hitDelay: 0.2,
  healthBarSeconds: 3,
  step: 1 / 60,
  waves: [
    "minotauro",
    "cerbero",
    "ciclope",
    "minotauro",
    "centimano",
    "cerbero",
    "cronos",
    "ciclope",
    "centimano",
    "cerbero",
  ] as MonsterKind[],
};
export const UNITS: Record<UnitKind, Stats> = { ...HEROES, ...MONSTERS };
