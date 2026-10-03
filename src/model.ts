import {
  BALANCE as B,
  HEROES,
  MONSTERS,
  TOWERS,
  UNITS,
  type HeroKind,
  type MonsterKind,
  type UnitKind,
  type Order,
  type TowerKind,
  type ShotKind,
} from "./config";
export type Side = "hero" | "monster";
export interface Unit {
  id: number;
  kind: UnitKind;
  side: Side;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  cooldown: number;
  state: "idle" | "walk" | "attack" | "hidden";
  face: number;
  hitUntil: number;
  attackUntil: number;
  slowUntil: number;
}
export interface Tower {
  id: number;
  kind: TowerKind;
  x: number;
  health: number;
  maxHealth: number;
  cooldown: number;
  paid: number;
  slot: number;
  hitUntil: number;
}
export interface Door {
  id: number;
  side: Side;
  x: number;
  health: number;
  maxHealth: number;
  hitUntil: number;
}
export interface Miner {
  name: string;
  x: number;
  state: "out" | "mine" | "back";
  work: number;
  load: number;
  phase: number;
}
export interface Projectile {
  id: number;
  source: number;
  side: Side;
  x: number;
  startX: number;
  targetId: number;
  targetX: number;
  shot: ShotKind;
  damage: number;
  remaining: number;
  total: number;
  burst: boolean;
}
export interface GameEvent {
  type: string;
  x: number;
  kind?: string;
  amount?: number;
  side?: Side;
}
type Target = Unit | Tower | Door;
export class Battle {
  time = 0;
  gold = B.initialGold;
  stone = B.initialStone;
  order: Order = "defend";
  paused = false;
  result: Side | null = null;
  units: Unit[] = [];
  towers: Tower[] = [];
  projectiles: Projectile[] = [];
  events: GameEvent[] = [];
  doors: Door[] = [
    {
      id: -1,
      side: "hero",
      x: B.home,
      health: B.doorHealth,
      maxHealth: B.doorHealth,
      hitUntil: 0,
    },
    {
      id: -2,
      side: "monster",
      x: B.enemy,
      health: B.doorHealth,
      maxHealth: B.doorHealth,
      hitUntil: 0,
    },
  ];
  miners: Miner[];
  nextWave = B.firstWave;
  wave = 0;
  nextId = 1;
  accumulator = 0;
  kills = 0;
  recruited = 0;
  constructor(names = ["Nico", "Leo"]) {
    this.miners = names.slice(0, 2).map((name, i) => ({
      name: name.trim().slice(0, 18) || ["Nico", "Leo"][i],
      x: B.home + i * 55,
      state: "out",
      work: 0,
      load: 0,
      phase: i * 2,
    }));
  }
  emit(type: string, x: number, kind?: string, amount?: number, side?: Side) {
    this.events.push({ type, x, kind, amount, side });
  }
  drain() {
    return this.events.splice(0);
  }
  get armySize() {
    return this.units.filter((u) => u.side === "hero").length;
  }
  recruit(kind: HeroKind): string | null {
    if (this.paused || this.result) return "La batalla está detenida";
    if (this.armySize >= B.heroLimit) return "Tu ejército está completo";
    if (this.gold < HEROES[kind].cost)
      return "Falta oro: espera una entrega de los campesinos";
    this.gold -= HEROES[kind].cost;
    this.spawn(kind, "hero");
    this.recruited++;
    this.emit("recruit", B.home, kind);
    return null;
  }
  spawn(kind: UnitKind, side: Side) {
    const s = UNITS[kind];
    const u: Unit = {
      id: this.nextId++,
      kind,
      side,
      x: side === "hero" ? B.home : B.enemy,
      y: (this.nextId % 4) * 7,
      health: s.health,
      maxHealth: s.health,
      cooldown: 0.3,
      state: "walk",
      face: side === "hero" ? 1 : -1,
      hitUntil: 0,
      attackUntil: 0,
      slowUntil: 0,
    };
    this.units.push(u);
    return u;
  }
  setOrder(order: Order) {
    if (this.paused || this.result || order === this.order) return;
    this.order = order;
    if (order !== "attack") {
      this.projectiles = this.projectiles.filter(
        (p) => p.side !== "hero" || p.shot !== "melee",
      );
      for (const u of this.units) if (u.side === "hero") u.attackUntil = 0;
    }
    this.emit("order", B.home, order);
  }
  build(slot: number, kind: TowerKind): string | null {
    if (this.paused || this.result) return "La batalla está detenida";
    if (!Number.isInteger(slot) || slot < 0 || slot >= B.towerSlots.length)
      return "Emplazamiento no válido";
    if (this.towers.some((t) => t.slot === slot))
      return "Este emplazamiento está ocupado";
    const s = TOWERS[kind];
    if (this.stone < s.cost)
      return "Falta piedra: tus campesinos están trabajando";
    this.stone -= s.cost;
    this.towers.push({
      id: this.nextId++,
      kind,
      slot,
      x: B.towerSlots[slot],
      health: s.health,
      maxHealth: s.health,
      cooldown: 0.4,
      paid: s.cost,
      hitUntil: 0,
    });
    this.emit("build", B.towerSlots[slot], kind);
    return null;
  }
  dismantle(slot: number) {
    if (this.paused || this.result) return false;
    const t = this.towers.find((t) => t.slot === slot);
    if (!t) return false;
    this.stone += Math.floor(t.paid * B.refundRatio);
    this.towers = this.towers.filter((a) => a !== t);
    this.emit("dismantle", t.x);
    return true;
  }
  convert() {
    if (this.paused || this.result || this.stone < B.conversionStone)
      return false;
    this.stone -= B.conversionStone;
    this.gold += B.conversionGold;
    this.emit("convert", B.home);
    return true;
  }
  advance(seconds: number) {
    if (this.paused || this.result) return;
    this.accumulator += Math.min(Math.max(seconds, 0), 0.25);
    while (this.accumulator >= B.step && !this.result) {
      this.tick(B.step);
      this.accumulator -= B.step;
    }
  }
  tick(dt: number) {
    if (this.paused || this.result) return;
    this.time += dt;
    for (const m of this.miners) {
      if (m.state === "mine") {
        m.work += dt;
        m.load = Math.min(1, m.work / B.miningSeconds);
        if (m.work >= B.miningSeconds) {
          m.state = "back";
          m.work = 0;
        }
      } else {
        const target = m.state === "out" ? B.mineX : B.home - 25;
        const dx = target - m.x;
        m.x += Math.sign(dx) * Math.min(Math.abs(dx), B.minerSpeed * dt);
        if (Math.abs(m.x - target) < 1) {
          if (m.state === "out") m.state = "mine";
          else {
            this.gold += B.deliveryGold;
            this.stone += B.deliveryStone;
            this.emit("delivery", m.x, undefined, B.deliveryGold);
            m.load = 0;
            m.state = "out";
          }
        }
      }
    }
    if (this.time >= this.nextWave) {
      if (
        this.units.filter((u) => u.side === "monster").length < B.enemyLimit
      ) {
        const kind = B.waves[this.wave % B.waves.length];
        this.spawn(kind, "monster");
        this.emit("wave", B.enemy, kind);
        this.wave++;
      }
      this.nextWave =
        this.time +
        Math.max(
          B.minWaveInterval,
          B.waveInterval - this.time * B.waveAcceleration,
        );
    }
    for (const p of [...this.projectiles]) {
      p.remaining -= dt;
      const target = this.target(p.targetId);
      if (!target || target.health <= 0) {
        this.projectiles = this.projectiles.filter((q) => q !== p);
        continue;
      }
      p.targetX = target.x;
      p.x =
        p.startX +
        (p.targetX - p.startX) * (1 - Math.max(0, p.remaining) / p.total);
      if (p.remaining <= 0) {
        this.projectiles = this.projectiles.filter((q) => q !== p);
        const source = this.units.find((u) => u.id === p.source);
        // Melee wind-up is cancelled if the attacker dies or the target escapes.
        if (
          p.shot === "melee" &&
          (!source ||
            source.state === "hidden" ||
            Math.abs(source.x - target.x) > UNITS[source.kind].range + 16)
        )
          continue;
        if ("state" in target && target.state === "hidden") continue;
        this.hit(target, p.damage, p.side, p.shot);
        if (p.shot === "fire")
          for (const u of this.units.filter(
            (u) =>
              u.side !== p.side &&
              u.id !== target.id &&
              u.state !== "hidden" &&
              Math.abs(u.x - target.x) < B.splashRadius,
          ))
            this.hit(u, p.damage * B.splashRatio, p.side, "fire");
        if (p.shot === "magic" && "slowUntil" in target)
          target.slowUntil = this.time + B.slowSeconds;
      }
    }
    for (const u of this.units) {
      if (u.health <= 0) continue;
      u.cooldown -= dt;
      const stats = UNITS[u.kind];
      if (
        u.side === "hero" &&
        this.order === "shelter" &&
        this.doors[0].health > 0
      ) {
        if (u.x <= B.home + 3) {
          u.state = "hidden";
          u.x = B.home - 16;
        } else this.move(u, B.home, dt);
        continue;
      }
      if (u.state === "hidden") {
        u.x = B.home + 8;
        u.state = "idle";
      }
      const defensive = u.side === "hero" && this.order !== "attack";
      if (defensive && u.x > B.defenseThreshold + 30) {
        this.move(u, B.defenseX, dt);
        continue;
      }
      const foes = this.units.filter(
        (v) =>
          v.side !== u.side &&
          v.health > 0 &&
          v.state !== "hidden" &&
          (!defensive || v.x < B.defenseThreshold),
      );
      const targets: Target[] = [...foes];
      if (u.side === "monster")
        targets.push(...this.towers.filter((t) => t.health > 0));
      const door = this.doors[u.side === "hero" ? 1 : 0];
      if (!defensive && door.health > 0) targets.push(door);
      targets.sort(
        (a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x) || a.id - b.id,
      );
      const target = targets[0];
      if (target && Math.abs(target.x - u.x) <= stats.range) {
        u.face = target.x >= u.x ? 1 : -1;
        u.state = "attack";
        u.hitUntil = Math.max(u.hitUntil, this.time + 0.2);
        if (u.cooldown <= 0) {
          this.attack(u, target, stats.shot, stats.damage, stats.interval);
          if (u.kind === "centimano") {
            this.launch(u, target, "melee", stats.damage, 0.34);
            this.launch(u, target, "melee", stats.damage, 0.49);
          }
        }
        if (
          stats.range > 100 &&
          "kind" in target &&
          target.x > u.x &&
          target.x - u.x < 105 &&
          u.x > B.home + 75
        )
          this.move(u, u.x - 35, dt);
      } else if (defensive) {
        const stand =
          B.defenseX + (u.id % 5) * 18 - (stats.range > 100 ? 80 : 0);
        this.move(
          u,
          target
            ? Math.min(B.defenseThreshold, target.x - stats.range + 5)
            : stand,
          dt,
        );
      } else {
        const dest = target
          ? target.x
          : door.x + (u.side === "hero" ? 65 : -65);
        this.move(u, dest, dt);
      }
      // A broken door alone never ends a battle. A living combatant must cross.
      if (
        !defensive &&
        door.health <= 0 &&
        ((u.side === "hero" && u.x > B.enemy + 42) ||
          (u.side === "monster" && u.x < B.home - 42))
      ) {
        this.result = u.side;
        this.emit("entered", u.x, u.kind, undefined, u.side);
        this.emit("result", u.x, undefined, undefined, u.side);
        break;
      }
    }
    if (!this.result)
      for (const t of this.towers) {
        if (t.health <= 0) continue;
        t.cooldown -= dt;
        const s = TOWERS[t.kind];
        const foe = this.units
          .filter(
            (u) =>
              u.side === "monster" &&
              u.health > 0 &&
              Math.abs(u.x - t.x) <= s.range,
          )
          .sort((a, b) => a.x - b.x)[0];
        if (foe && t.cooldown <= 0) {
          t.cooldown = s.interval;
          this.launch(t, foe, s.shot, s.damage);
          this.emit("shot", t.x, s.shot);
        }
      }
    this.units = this.units.filter((u) => u.health > 0);
    this.towers = this.towers.filter((t) => t.health > 0);
  }
  move(u: Unit, target: number, dt: number) {
    const dx = target - u.x;
    if (Math.abs(dx) < 2) {
      u.state = "idle";
      return;
    }
    u.face = dx > 0 ? 1 : -1;
    u.state = "walk";
    u.x +=
      Math.sign(dx) *
      Math.min(
        Math.abs(dx),
        UNITS[u.kind].speed * (u.slowUntil > this.time ? B.slowRatio : 1) * dt,
      );
    if (u.side === "hero" && this.doors[1].health > 0)
      u.x = Math.min(u.x, B.enemy - 25);
    if (u.side === "monster" && this.doors[0].health > 0)
      u.x = Math.max(u.x, B.home + 25);
    u.x = Math.max(80, Math.min(B.worldWidth - 80, u.x));
  }
  attack(u: Unit, t: Target, shot: ShotKind, damage: number, interval: number) {
    u.cooldown = interval;
    u.attackUntil = this.time + 0.45;
    this.launch(u, t, shot, damage);
    this.emit("shot", u.x, shot);
  }
  launch(
    source: Unit | Tower,
    target: Target,
    shot: ShotKind,
    damage: number,
    delay?: number,
  ) {
    const total =
      delay ??
      (shot === "melee"
        ? B.hitDelay
        : Math.max(0.16, Math.abs(source.x - target.x) / B.projectileSpeed));
    this.projectiles.push({
      id: this.nextId++,
      source: source.id,
      side: "side" in source ? source.side : "hero",
      x: source.x,
      startX: source.x,
      targetId: target.id,
      targetX: target.x,
      shot,
      damage,
      remaining: total,
      total,
      burst: false,
    });
  }
  target(id: number): Target | undefined {
    return (
      this.units.find((u) => u.id === id && u.health > 0) ||
      this.towers.find((t) => t.id === id && t.health > 0) ||
      this.doors.find((d) => d.id === id)
    );
  }
  hit(target: Target, amount: number, side: Side, shot: ShotKind) {
    if (target.health <= 0) return;
    if (
      "kind" in target &&
      target.kind === "aquiles" &&
      "face" in target &&
      target.face === 1 &&
      side === "monster"
    )
      amount *= 1 - B.shieldReduction;
    target.health = Math.max(0, target.health - amount);
    target.hitUntil = this.time + B.healthBarSeconds;
    this.emit("hit", target.x, shot, Math.round(amount));
    if (target.health === 0) {
      if (target.id < 0) this.emit("door", target.x);
      else {
        this.emit(
          "death",
          target.x,
          "kind" in target ? target.kind : undefined,
        );
        if ("side" in target && target.side === "monster") this.kills++;
      }
    }
  }
}
