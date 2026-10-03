import { expect, it } from "vitest";
import { simulate } from "../scripts/balance";
it.each(["offensive", "defensive", "retreat"] as const)(
  "partida completa con estrategia %s",
  (profile) => {
    const r = simulate(profile);
    expect(r.result).toBe("hero");
    expect(r.time).toBeLessThan(720);
    if (profile === "defensive") expect(r.monsters).toHaveLength(5);
    if (profile === "retreat") expect(r.sheltered).toBe(true);
  },
);
