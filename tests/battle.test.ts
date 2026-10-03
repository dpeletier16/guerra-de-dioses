import { describe, it, expect } from "vitest";
import { Battle } from "../src/model";
import {
  BALANCE as B,
  HEROES,
  TOWERS,
  type HeroKind,
  type TowerKind,
} from "../src/config";
const run = (b: Battle, seconds: number) => {
  for (let t = 0; t < seconds && !b.result; t += B.step) {
    b.advance(B.step);
    b.drain();
  }
};
const quiet = () => {
  const b = new Battle();
  b.nextWave = Infinity;
  return b;
};
describe("Economía y reclutamiento", () => {
  it("dos campesinos nombrados: solo ingresan la carga al regresar", () => {
    const b = new Battle(["Ada", "David"]);
    expect(b.miners.map((m) => m.name)).toEqual(["Ada", "David"]);
    run(b, 4);
    expect(b.gold).toBe(B.initialGold);
    expect(b.miners.some((m) => m.load > 0)).toBe(true);
    run(b, 6);
    expect(b.gold).toBeGreaterThan(B.initialGold);
    expect(b.stone).toBeGreaterThan(B.initialStone);
  });
  it("pausa congela economía, IA, proyectiles y tiempo", () => {
    const b = new Battle();
    run(b, 35);
    b.paused = true;
    const before = JSON.stringify(b);
    run(b, 90);
    expect(JSON.stringify(b)).toBe(before);
    b.paused = false;
    run(b, 20);
    expect(b.wave).toBeGreaterThan(1);
  });
  it.each(Object.keys(HEROES) as HeroKind[])(
    "compra %s con coste exacto, rechaza oro insuficiente",
    (kind) => {
      const b = quiet();
      b.gold = HEROES[kind].cost;
      expect(b.recruit(kind)).toBeNull();
      expect(b.gold).toBe(0);
      expect(b.units[0].x).toBe(B.home);
      expect(b.units[0].kind).toBe(kind);
      expect(b.recruit(kind)).toMatch(/oro/);
      expect(b.units.length).toBe(1);
    },
  );
  it("límite de ejército sin gasto y conversión atómica", () => {
    const b = quiet();
    b.gold = 100000;
    for (let i = 0; i < B.heroLimit; i++) b.recruit("atalanta");
    const gold = b.gold;
    expect(b.recruit("aquiles")).toMatch(/completo/);
    expect(b.gold).toBe(gold);
    b.stone = B.conversionStone - 1;
    expect(b.convert()).toBe(false);
    expect(b.gold).toBe(gold);
    b.stone++;
    expect(b.convert()).toBe(true);
    expect(b.stone).toBe(0);
    expect(b.gold).toBe(gold + B.conversionGold);
  });
});
describe("Torres", () => {
  it.each(Object.keys(TOWERS) as TowerKind[])(
    "%s: paga una vez, devuelve el coste y no admite doble devolución",
    (kind) => {
      const b = quiet();
      b.stone = TOWERS[kind].cost;
      expect(b.build(0, kind)).toBeNull();
      expect(b.stone).toBe(0);
      expect(b.build(0, kind)).toMatch(/ocupado/);
      expect(b.build(-1, kind)).toMatch(/válido/);
      expect(b.build(1, kind)).toMatch(/piedra/);
      expect(b.dismantle(0)).toBe(true);
      expect(b.stone).toBe(TOWERS[kind].cost);
      expect(b.dismantle(0)).toBe(false);
      expect(b.stone).toBe(TOWERS[kind].cost);
    },
  );
  it("torre destruida no devuelve piedra y libera el espacio", () => {
    const b = quiet();
    b.stone = 500;
    b.build(1, "magia");
    const t = b.towers[0],
      stone = b.stone;
    b.hit(t, 999, "monster", "melee");
    b.tick(B.step);
    expect(b.towers).toHaveLength(0);
    expect(b.dismantle(1)).toBe(false);
    expect(b.stone).toBe(stone);
    expect(b.build(1, "flechas")).toBeNull();
  });
});
describe("Órdenes y combate", () => {
  it("atacar avanza, defender retira y refugiarse protege solo con puerta intacta", () => {
    const b = quiet();
    b.recruit("aquiles");
    b.setOrder("attack");
    run(b, 18);
    expect(b.units[0].x).toBeGreaterThan(1000);
    b.setOrder("defend");
    const x = b.units[0].x;
    run(b, 0.5);
    expect(b.units[0].x).toBeLessThan(x);
    run(b, 20);
    expect(b.units[0].x).toBeLessThan(B.defenseThreshold);
    b.setOrder("shelter");
    run(b, 10);
    expect(b.units[0].state).toBe("hidden");
    b.doors[0].health = 0;
    run(b, 0.5);
    expect(b.units[0].state).not.toBe("hidden");
    b.setOrder("attack");
    run(b, 3);
    expect(b.units[0].x).toBeGreaterThan(B.home);
  });
  it("las flechas viajan antes de causar daño y solo impactan una vez", () => {
    const b = quiet(),
      a = b.spawn("atalanta", "hero"),
      m = b.spawn("minotauro", "monster");
    a.x = 800;
    m.x = 1050;
    a.cooldown = 0;
    b.setOrder("attack");
    b.tick(B.step);
    expect(b.projectiles.length).toBe(1);
    expect(m.health).toBe(m.maxHealth);
    run(b, 0.2);
    expect(m.health).toBe(m.maxHealth);
    run(b, 0.4);
    expect(m.health).toBe(m.maxHealth - HEROES.atalanta.damage);
  });
  it("un muerto no ataca, y su muerte solo se notifica una vez", () => {
    const b = quiet(),
      a = b.spawn("hercules", "hero"),
      m = b.spawn("cerbero", "monster");
    a.x = 800;
    m.x = 830;
    b.setOrder("attack");
    a.cooldown = 0;
    b.tick(B.step);
    b.hit(a, 10000, "monster", "melee");
    b.hit(a, 10000, "monster", "melee");
    expect(b.events.filter((e) => e.type === "death")).toHaveLength(1);
    b.drain();
    run(b, 0.5);
    expect(b.units.some((u) => u.id === a.id)).toBe(false);
    expect(m.health).toBe(m.maxHealth);
  });
  it("fuego en área y magia ralentizan de verdad", () => {
    const b = quiet(),
      a = b.spawn("medea", "hero"),
      m = b.spawn("minotauro", "monster"),
      m2 = b.spawn("ciclope", "monster");
    a.x = 700;
    m.x = 900;
    m2.x = 930;
    b.setOrder("attack");
    a.cooldown = 0;
    run(b, 0.65);
    expect(m.health).toBeLessThan(m.maxHealth);
    expect(m2.health).toBeLessThan(m2.maxHealth);
    b.stone = 500;
    b.build(2, "magia");
    m.x = B.towerSlots[2] + 100;
    run(b, 1);
    expect(
      b.units.some((u) => u.side === "monster" && u.slowUntil > b.time),
    ).toBe(true);
    const slowed = b.units.find((u) => u.slowUntil > b.time)!;
    const start = slowed.x;
    b.move(slowed, start - 100, 0.1);
    const slowDistance = start - slowed.x;
    slowed.slowUntil = 0;
    const again = slowed.x;
    b.move(slowed, again - 100, 0.1);
    expect(again - slowed.x).toBeGreaterThan(slowDistance);
  });
  it("los cinco monstruos salen de la fortaleza roja", () => {
    const b = quiet();
    b.nextWave = 0;
    const kinds = new Set<string>();
    for (let i = 0; i < 7; i++) {
      b.nextWave = b.time;
      b.tick(B.step);
      const u = b.units[b.units.length - 1];
      kinds.add(u.kind);
      expect(u.x).toBeGreaterThan(B.enemy - 5);
    }
    expect(kinds.size).toBe(5);
  });
});
describe("Puertas, resultados y reinicio", () => {
  it.each(["hero", "monster"] as const)(
    "victoria de %s exige puerta rota, unidad viva y cruce; se resuelve una vez",
    (side) => {
      const b = quiet();
      const u = b.spawn(side === "hero" ? "hercules" : "cronos", side);
      b.setOrder("attack");
      const d = b.doors[side === "hero" ? 1 : 0];
      u.x = d.x + (side === "hero" ? -30 : 30);
      run(b, 0.5);
      expect(b.result).toBeNull();
      d.health = 0;
      expect(b.result).toBeNull();
      run(b, 0.2);
      expect(b.result).toBeNull();
      run(b, 3);
      expect(b.result).toBe(side);
      const snapshot = JSON.stringify(b);
      run(b, 10);
      expect(JSON.stringify(b)).toBe(snapshot);
    },
  );
  it("no se entra atravesando puerta intacta ni con una unidad muerta", () => {
    const b = quiet();
    b.setOrder("attack");
    const u = b.spawn("perseo", "hero");
    u.x = B.enemy - 26;
    b.move(u, B.enemy + 80, 1);
    expect(u.x).toBeLessThan(B.enemy);
    b.doors[1].health = 0;
    u.x = B.enemy + 60;
    u.health = 0;
    run(b, 1);
    expect(b.result).toBeNull();
  });
  it("derrota real por inacción y partida nueva limpia", () => {
    const b = new Battle();
    run(b, 600);
    expect(b.result).toBe("monster");
    const fresh = new Battle();
    expect(fresh.units).toHaveLength(0);
    expect(fresh.projectiles).toHaveLength(0);
    expect(fresh.gold).toBe(B.initialGold);
    expect(fresh.time).toBe(0);
    expect(fresh.doors[0].health).toBe(B.doorHealth);
  });
});
