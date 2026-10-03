import { test, expect, type Page } from "@playwright/test";
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Comenzar la aventura" }).click();
  await page
    .getByRole("button", { name: "Espada y escudo: iniciar batalla" })
    .click();
  await page.getByRole("textbox", { name: "Campesino 1" }).fill("David");
  await page.getByRole("textbox", { name: "Campesino 2" }).fill("Atenea");
  await page.getByRole("button", { name: "A la batalla" }).click();
  await page.locator("#skip-tip").click();
  await expect(page.locator("#recruit-aquiles")).toBeEnabled();
}
test("Estrés: veinte héroes, combate y cinco reinicios sin acumular objetos", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  const report = await page.evaluate(() => {
    const g = (window as any).__game,
      counts: number[] = [],
      textures: number[] = [];
    let maxProjectiles = 0;
    for (let round = 0; round < 5; round++) {
      g.scene.startBattle(["David", "Atenea"]);
      const b = g.getBattle();
      b.gold = 100000;
      b.nextWave = Infinity;
      for (let i = 0; i < 20; i++)
        b.recruit(
          ["aquiles", "atalanta", "hercules", "medea", "perseo"][i % 5],
        );
      for (let i = 0; i < 24; i++)
        b.spawn(
          ["minotauro", "ciclope", "centimano", "cerbero", "cronos"][i % 5],
          "monster",
        );
      b.setOrder("attack");
      for (let i = 0; i < 100 && !b.result; i++) {
        g.advance(1);
        maxProjectiles = Math.max(maxProjectiles, b.projectiles.length);
      }
      g.scene.startBattle(["David", "Atenea"]);
      g.scene.sync(0);
      counts.push(g.scene.children.length);
      textures.push(g.scene.textures.getTextureKeys().length);
    }
    return {
      counts,
      textures,
      maxProjectiles,
      units: g.snapshot().units.length,
    };
  });
  expect(new Set(report.counts).size).toBe(1);
  expect(new Set(report.textures).size).toBe(1);
  expect(report.units).toBe(0);
  expect(report.maxProjectiles).toBeGreaterThan(0);
  expect(report.maxProjectiles).toBeLessThan(200);
  expect(errors).toEqual([]);
});
async function step(page: Page, seconds: number) {
  await page.evaluate((s) => (window as any).__game.advance(s), seconds);
}
async function slot(page: Page, index: number) {
  const p = await page.evaluate((i) => {
    const s = (window as any).__game.scene,
      c = s.cameras.main,
      p = c.matrixCombined.transformPoint([470, 650, 830][i], 507),
      r = s.game.canvas.getBoundingClientRect();
    return {
      x: r.x + (p.x * r.width) / s.scale.width,
      y: r.y + (p.y * r.height) / s.scale.height,
    };
  }, index);
  await page.mouse.click(p.x, p.y);
}
test("Inicio, nombres completos, compras, torres, devolución, cambio y pausa", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  const names = await page.evaluate(() =>
    (window as any).__game.snapshot().miners.map((m: any) => m.name),
  );
  expect(names).toEqual(["David", "Atenea"]);
  await page.locator("#recruit-aquiles").click();
  await expect(page.locator("#recruit-hercules")).toBeDisabled();
  await step(page, 23);
  await page.locator("#camera-home").click();
  await page.waitForTimeout(700);
  await slot(page, 0);
  await expect(page.locator("#build-flechas")).toBeEnabled();
  await page.locator("#build-flechas").click();
  await slot(page, 0);
  const before = await page.evaluate(
    () => (window as any).__game.snapshot().stone,
  );
  await page.locator("#dismantle").click();
  const after = await page.evaluate(
    () => (window as any).__game.snapshot().stone,
  );
  expect(after - before).toBeGreaterThanOrEqual(85);
  expect((after - before - 85) % 13).toBe(0);
  await expect(page.locator("#tower-panel")).toBeEmpty();
  expect(
    await page.evaluate(() => (window as any).__game.snapshot().towers.length),
  ).toBe(0);
  await page.locator("#convert").click();
  const changed = await page.evaluate(
    () => (window as any).__game.snapshot().stone,
  );
  expect(after - changed).toBeLessThanOrEqual(60);
  expect((60 - (after - changed)) % 13).toBe(0);
  await page.locator("#pause").click();
  const paused = await page.evaluate(() =>
    JSON.stringify((window as any).__game.getBattle()),
  );
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() =>
      JSON.stringify((window as any).__game.getBattle()),
    ),
  ).toBe(paused);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Batalla en pausa" }),
  ).not.toBeVisible();
  await page.locator("#order-shelter").click();
  await step(page, 10);
  expect(
    await page.evaluate(() =>
      (window as any).__game
        .snapshot()
        .units.filter((u: any) => u.side === "hero")
        .every((u: any) => u.state === "hidden"),
    ),
  ).toBe(true);
  await page.locator("#order-attack").click();
  await step(page, 2);
  expect(
    await page.evaluate(() => (window as any).__game.snapshot().units[0].x),
  ).toBeGreaterThan(230);
  expect(errors).toEqual([]);
});
test("Partida defensiva: cinco héroes, tres torres, cinco monstruos, contraataque y victoria", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  const result = await page.evaluate(() => {
    const g = (window as any).__game;
    const bought = new Set(),
      built = new Set(),
      seen = new Set();
    let pick = 0;
    const heroes = ["aquiles", "atalanta", "hercules", "medea", "perseo"];
    for (let t = 0; t < 500 && !g.getBattle().result; t++) {
      const b = g.getBattle(),
        kind = heroes[pick % 5],
        button = document.getElementById(
          `recruit-${kind}`,
        ) as HTMLButtonElement;
      if (!button.disabled) {
        button.click();
        bought.add(kind);
        pick++;
      }
      for (const [i, k] of ["flechas", "fuego", "magia"].entries()) {
        if (!b.towers.some((x: any) => x.slot === i)) {
          g.scene.ui.openTower(i);
          const button = document.getElementById(
            `build-${k}`,
          ) as HTMLButtonElement;
          if (button && !button.disabled) {
            button.click();
            built.add(k);
          }
        }
      }
      g.scene.ui.closeTower();
      if (t === 145) document.getElementById("order-attack")!.click();
      g.advance(1);
      for (const u of b.units) if (u.side === "monster") seen.add(u.kind);
    }
    return {
      result: g.snapshot().result,
      time: g.snapshot().time,
      bought: [...bought],
      built: [...built],
      seen: [...seen],
    };
  });
  expect(result.result).toBe("hero");
  expect(result.bought).toHaveLength(5);
  expect(result.built).toHaveLength(3);
  expect(result.seen).toHaveLength(5);
  await expect(
    page.getByRole("heading", { name: "¡La victoria es tuya!" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/victory.png" });
  expect(errors).toEqual([]);
  await page
    .getByRole("button", { name: "Volver a jugar", exact: true })
    .click();
  const fresh = await page.evaluate(() => (window as any).__game.snapshot());
  expect(fresh.gold).toBe(140);
  expect(fresh.units).toHaveLength(0);
  expect(fresh.projectiles).toBe(0);
  expect(fresh.result).toBeNull();
  expect(fresh.miners).toHaveLength(2);
});
test("Derrota sin defensas, reinicio y preferencias persistentes", async ({
  page,
}) => {
  await start(page);
  await step(page, 240);
  await expect(
    page.getByRole("heading", { name: "Tu fortaleza ha caído" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/defeat.png" });
  await page
    .getByRole("button", { name: "Volver al mapa", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Espada y escudo: iniciar batalla" }),
  ).toBeVisible();
  await page.locator("#sound").click();
  await expect(page.locator("#sound")).toHaveText("♫ Sonido: no");
  await page.reload();
  await expect(page.locator("#sound")).toHaveText("♫ Sonido: no");
});
test("Pantalla horizontal pequeña: controles utilizables y panorama por botones", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await start(page);
  await page.locator("#recruit-aquiles").click();
  await page.locator("#camera-enemy").click();
  await page.waitForTimeout(700);
  expect(
    await page.evaluate(
      () => (window as any).__game.scene.cameras.main.scrollX,
    ),
  ).toBeGreaterThan(0);
  await page.locator("#camera-home").click();
  await page.waitForTimeout(700);
  await slot(page, 0);
  await expect(
    page.getByRole("heading", { name: "Construye una torre" }),
  ).toBeVisible();
  await page.locator("#close-tower").click();
  await page.locator("#pause").click();
  await expect(page.locator("#resume")).toBeInViewport();
  await page.locator("#resume").click();
  await page.screenshot({ path: "docs/screenshots/mobile-landscape.png" });
});
test("Capturas de presentación, mapa, combate y hoja de personajes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#play")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/menu.png" });
  await page.locator("#play").click();
  await page.waitForTimeout(1500);
  expect(await page.locator('.map-image').evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth>0)).toBe(true);
  const invalidArt=await page.evaluate(async()=>{
    const files=['map','roster','mine','castle-home','castle-enemy',...['sky','mountains','hills','ground'].map(k=>`landscape-${k}`),...['aquiles','atalanta','hercules','medea','perseo','minotauro','ciclope','centimano','cerbero','cronos','miner'].flatMap(k=>Array.from({length:6},(_,i)=>`${k}-${i}`)),...['flechas','fuego','magia'].map(k=>`tower-${k}`),...Array.from({length:4},(_,i)=>`door-${i}`)];
    const invalid:string[]=[];for(const file of files){const response=await fetch(`/art/${file}.svg`);const xml=new DOMParser().parseFromString(await response.text(),'image/svg+xml');if(!response.ok||xml.querySelector('parsererror'))invalid.push(file);}return invalid;
  });
  expect(invalidArt).toEqual([]);
  await page.screenshot({ path: "docs/screenshots/map.png" });
  await start(page);
  await page.evaluate(() => {
    const g = (window as any).__game,
      heroes = ["aquiles", "atalanta", "hercules", "medea", "perseo"];
    let pick = 0;
    for (let t = 0; t < 115; t++) {
      const b = g.getBattle();
      const button = document.getElementById(
        `recruit-${heroes[pick % 5]}`,
      ) as HTMLButtonElement;
      if (!button.disabled) {
        button.click();
        pick++;
      }
      for (const [i, k] of ["flechas", "fuego", "magia"].entries())
        if (!b.towers.some((x: any) => x.slot === i)) {
          g.scene.ui.openTower(i);
          const button = document.getElementById(
            `build-${k}`,
          ) as HTMLButtonElement;
          if (button && !button.disabled) button.click();
        }
      g.scene.ui.closeTower();
      g.advance(1);
    }
    g.scene.focusCastle(false);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "docs/screenshots/battle.png" });
  await page.goto("/art/roster.svg");
  await page.screenshot({ path: "docs/screenshots/roster.png" });
});
