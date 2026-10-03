import { Battle } from "../src/model";
import {
  BALANCE as B,
  HEROES,
  type HeroKind,
  type TowerKind,
} from "../src/config";
export function simulate(
  profile: "offensive" | "defensive" | "retreat" | "idle",
) {
  const b = new Battle();
  const kinds: HeroKind[] = [
    "aquiles",
    "atalanta",
    "hercules",
    "medea",
    "perseo",
  ];
  let pick = 0,
    decision = 0;
  const monsters = new Set<string>();
  let sheltered = false;
  for (let t = 0; t < 720 && !b.result; t += B.step) {
    if (t >= decision) {
      decision = t + 0.5;
      if (profile !== "idle") {
        b.setOrder(
          profile === "defensive" && t < 145
            ? "defend"
            : profile === "retreat" && t > 75 && t < 105
              ? "shelter"
              : "attack",
        );
        const k = kinds[pick % kinds.length];
        if (b.gold >= HEROES[k].cost && b.armySize < B.heroLimit) {
          b.recruit(k);
          pick++;
        }
        if (profile === "defensive")
          for (const [i, kind] of (
            ["flechas", "fuego", "magia"] as TowerKind[]
          ).entries())
            if (!b.towers.some((t) => t.slot === i)) b.build(i, kind);
        if (profile !== "defensive" && b.stone >= B.conversionStone)
          b.convert();
      }
    }
    b.advance(B.step);
    if (b.units.some((u) => u.state === "hidden")) sheltered = true;
    for (const e of b.drain())
      if (e.type === "wave" && e.kind) monsters.add(e.kind);
  }
  return {
    profile,
    result: b.result,
    time: Math.round(b.time),
    recruited: b.recruited,
    kills: b.kills,
    doors: b.doors.map((d) => Math.round(d.health)),
    monsters: [...monsters],
    sheltered,
    remaining: b.units.length,
  };
}
if (process.argv[1]?.endsWith("balance.ts"))
  for (const p of ["offensive", "defensive", "retreat", "idle"] as const)
    console.log(JSON.stringify(simulate(p)));
