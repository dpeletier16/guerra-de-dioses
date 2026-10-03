import Phaser from "phaser";
import { BALANCE as B, UNITS, TOWERS } from "./config";
import { Battle, type Unit, type GameEvent } from "./model";
import { Interface } from "./ui";
import { AudioDirector } from "./audio";
interface Figure {
  image: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  death?: number;
}
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: number;
  size: number;
}
export class WorldScene extends Phaser.Scene {
  ui!: Interface;
  audioDirector = new AudioDirector();
  battle?: Battle;
  figures = new Map<number, Figure>();
  towerImages = new Map<number, Phaser.GameObjects.Image>();
  doorImages: Phaser.GameObjects.Image[] = [];
  miners: Phaser.GameObjects.Image[] = [];
  minerLabels: Phaser.GameObjects.Text[] = [];
  particles: Spark[] = [];
  floaters: { text: Phaser.GameObjects.Text; until: number }[] = [];
  ink!: Phaser.GameObjects.Graphics;
  effects!: Phaser.GameObjects.Graphics;
  slots: Phaser.GameObjects.Container[] = [];
  keys?: Record<string, Phaser.Input.Keyboard.Key>;
  clouds: Phaser.GameObjects.Ellipse[] = [];
  signage: Phaser.GameObjects.Text[] = [];
  intro = 0;
  panTarget: number | null = null;
  dragX = 0;
  dragged = false;
  armedSlot: number | null = null;
  hudClock = 0;
  mineClock = 0;
  constructor() {
    super("World");
  }
  preload() {
    this.ui = new Interface(this.audioDirector, {
      startBattle: (names) => this.startBattle(names),
      showWorld: () => this.showWorld(),
      camera: (e) => this.focusCastle(e),
      pause: () => {},
    });
    this.ui.loading();
    this.load.on("progress", (p: number) => this.ui.loading(p));
    const files = [
      ...["sky", "mountains", "hills", "ground"].map((k) => `landscape-${k}`),
      "mine",
      "castle-home",
      "castle-enemy",
      ...Array.from({ length: 4 }, (_, i) => `door-${i}`),
      ...Object.keys(TOWERS).map((k) => `tower-${k}`),
    ];
    for (const k of [...Object.keys(UNITS), "miner"])
      for (let f = 0; f < 6; f++) files.push(`${k}-${f}`);
    for (const key of files)
      this.load.svg(key, `${import.meta.env.BASE_URL}art/${key}.svg`);
    this.load.on("loaderror", (file: Phaser.Loader.File) =>
      this.ui.toast(`No se pudo cargar ${file.key}. Recarga la página.`),
    );
  }
  create() {
    for (const [i, layer] of ["sky", "mountains", "hills", "ground"].entries())
      this.add
        .image(0, 0, `landscape-${layer}`)
        .setOrigin(0)
        .setDepth(-25 + i)
        .setScrollFactor([0.15, 0.4, 0.72, 1][i], 1);
    for (let i = 0; i < 8; i++) {
      const x = i * 340 + 80,
        y = 65 + (i % 3) * 34;
      this.clouds.push(
        this.add.ellipse(x, y, 180, 23, 0xfff7dd, 0.24).setDepth(-19),
      );
      this.clouds.push(
        this.add.ellipse(x + 24, y - 10, 98, 33, 0xfff7dd, 0.27).setDepth(-19),
      );
    }
    this.add
      .image(B.home, 483, "castle-home")
      .setOrigin(0.48, 0.94)
      .setDepth(-4);
    this.add
      .image(B.enemy, 483, "castle-enemy")
      .setOrigin(0.48, 0.94)
      .setDepth(-4);
    this.doorImages = [
      this.add.image(B.home, 483, "door-0").setOrigin(0.5, 1).setDepth(-3),
      this.add.image(B.enemy, 483, "door-0").setOrigin(0.5, 1).setDepth(-3),
    ];
    this.add
      .image(B.mineX, 455, "mine")
      .setOrigin(0.5, 1)
      .setDisplaySize(140, 107)
      .setDepth(-5);
    this.add
      .text(B.mineX, 336, "YACIMIENTO", {
        fontFamily: "sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#345161",
        backgroundColor: "#f5e3b7",
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(-4);
    this.add
      .text(B.home, 156, "TU FORTALEZA", {
        fontFamily: "sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#234f69",
        backgroundColor: "#f1dfb6",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(-4);
    this.add
      .text(B.enemy, 156, "CASTILLO ENEMIGO", {
        fontFamily: "sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#f5e2c0",
        backgroundColor: "#684757",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(-4);
    const defense = this.add.graphics().setDepth(-2);
    defense.lineStyle(2, 0x498a9c, 0.35);
    for (let y = 350; y < 522; y += 15)
      defense.lineBetween(B.defenseThreshold, y, B.defenseThreshold, y + 7);
    this.add
      .text(B.defenseThreshold, 535, "LÍMITE DE DEFENSA", {
        fontFamily: "sans-serif",
        fontSize: "10px",
        color: "#3f737e",
      })
      .setOrigin(0.5);
    for (const [i, x] of B.towerSlots.entries()) {
      const shadow = this.add.ellipse(0, 0, 94, 28, 0x425e59, 0.2),
        platform = this.add
          .ellipse(0, -3, 88, 26, 0xe7d3a2, 0.7)
          .setStrokeStyle(2, 0x8c9478),
        plus = this.add
          .text(0, -12, "+", {
            fontFamily: "sans-serif",
            fontSize: "34px",
            fontStyle: "bold",
            color: "#416b70",
          })
          .setOrigin(0.5),
        label = this.add
          .text(0, 24, `TORRE ${i + 1}`, {
            fontFamily: "sans-serif",
            fontSize: "10px",
            fontStyle: "bold",
            color: "#435e5b",
          })
          .setOrigin(0.5);
      const slot = this.add
        .container(x, 507, [shadow, platform, plus, label])
        .setSize(110, 90)
        .setDepth(8)
        .setInteractive({ useHandCursor: true });
      slot.on("pointerdown", () => {
        this.armedSlot = i;
      });
      slot.on("pointerup", () => {
        if (this.armedSlot === i && !this.dragged && this.battle)
          this.ui.openTower(i);
        this.armedSlot = null;
      });
      this.slots.push(slot);
    }
    this.ink = this.add.graphics().setDepth(30);
    this.effects = this.add.graphics().setDepth(32);
    this.keys = this.input.keyboard?.addKeys("A,D,LEFT,RIGHT", false) as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.code === "KeyM") {
        this.audioDirector.toggle();
        this.ui.settings();
        return;
      }
      if (!this.battle || this.battle.result) return;
      if (e.code === "Escape") {
        e.preventDefault();
        this.ui.togglePause();
      } else if (e.code === "Digit1") this.battle.setOrder("shelter");
      else if (e.code === "Digit2") this.battle.setOrder("defend");
      else if (e.code === "Digit3") this.battle.setOrder("attack");
    });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.dragX = p.x;
      this.dragged = false;
    });
    this.input.on("pointerup", () => {
      this.armedSlot = null;
    });
    this.game.canvas.addEventListener("mouseleave", () => {
      this.input.activePointer.isDown = false;
      this.armedSlot = null;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!p.isDown || !this.battle) return;
      if (Math.abs(p.x - this.dragX) > 5) this.dragged = true;
      if (this.dragged) {
        this.panTarget = null;
        this.intro = 0;
        this.cameras.main.scrollX -=
          (p.x - p.prevPosition.x) / this.cameras.main.zoom;
        this.clampCamera();
      }
    });
    this.scale.on("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      if (
        document.hidden &&
        this.battle &&
        !this.battle.paused &&
        !this.battle.result
      )
        this.ui.togglePause(true);
    });
    this.signage = this.children.list.filter(
      (child): child is Phaser.GameObjects.Text =>
        child instanceof Phaser.GameObjects.Text,
    );
    this.resize();
    this.ui.menu();
    if (import.meta.env.DEV) {
      (window as unknown as { __game: unknown }).__game = {
        scene: this,
        getBattle: () => this.battle,
        snapshot: () => this.snapshot(),
        advance: (seconds: number) => {
          if (!this.battle) return;
          for (let t = 0; t < seconds && !this.battle.result; t += B.step) {
            this.battle.advance(B.step);
            this.battle.drain();
          }
          this.sync(0);
          this.ui.update();
          if (this.battle.result) this.ui.result();
        },
      };
    }
  }
  resize() {
    const h = this.scale.height,
      w = this.scale.width;
    const zoom = Math.max(h / 620, 0.65);
    this.cameras.main.setZoom(zoom).setViewport(0, 0, w, h);
    this.cameras.main.setBounds(0, 0, B.worldWidth, 620);
    this.cameras.main.centerOn(
      this.battle
        ? Math.min(B.worldWidth - w / zoom / 2, this.cameras.main.midPoint.x)
        : 700,
      h / zoom < 620 ? 560 - h / zoom / 2 : 310,
    );
    this.clampCamera();
  }
  clampCamera() {
    const c = this.cameras.main;
    c.scrollX = Phaser.Math.Clamp(
      c.scrollX,
      0,
      Math.max(0, B.worldWidth - this.scale.width / c.zoom),
    );
  }
  showWorld() {
    this.battle = undefined;
    this.clearBattle();
    this.signage.forEach((label) => label.setVisible(false));
    this.cameras.main.scrollX = 0;
    this.cameras.main.setAlpha(1);
  }
  clearBattle() {
    for (const f of this.figures.values()) {
      f.image.destroy();
      f.shadow.destroy();
    }
    this.figures.clear();
    for (const t of this.towerImages.values()) t.destroy();
    this.towerImages.clear();
    this.miners.forEach((i) => i.destroy());
    this.miners = [];
    this.minerLabels.forEach((i) => i.destroy());
    this.minerLabels = [];
    this.floaters.forEach((f) => f.text.destroy());
    this.floaters = [];
    this.particles = [];
    this.ink?.clear();
    this.effects?.clear();
    this.doorImages.forEach((d) => d.setTexture("door-0"));
    this.slots.forEach((s) => s.setVisible(false));
  }
  startBattle(names: string[]) {
    this.clearBattle();
    this.signage.forEach((label) => label.setVisible(true));
    this.battle = new Battle(names);
    this.hudClock = 0;
    this.mineClock = 0;
    this.ui.hud(this.battle);
    this.slots.forEach((s) => s.setVisible(true));
    this.miners = this.battle.miners.map(() =>
      this.add
        .image(0, 0, "miner-0")
        .setOrigin(0.5, 1)
        .setDisplaySize(59, 63)
        .setDepth(5),
    );
    this.minerLabels = names.map((name) =>
      this.add
        .text(0, 0, name, {
          fontFamily: "sans-serif",
          fontSize: "11px",
          fontStyle: "bold",
          color: "#f9ebc6",
          backgroundColor: "#355367",
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(12),
    );
    this.resize();
    this.cameras.main.scrollX = Math.max(
      0,
      B.worldWidth - this.scale.width / this.cameras.main.zoom,
    );
    this.intro = this.ui.reduced ? 0 : 2.2;
    this.panTarget = 0;
    if (this.ui.reduced) this.cameras.main.scrollX = 0;
    this.sync(0);
  }
  focusCastle(enemy: boolean) {
    this.intro = 0;
    this.panTarget = enemy
      ? Math.max(0, B.worldWidth - this.scale.width / this.cameras.main.zoom)
      : 0;
  }
  snapshot() {
    const b = this.battle;
    return b
      ? {
          time: b.time,
          gold: b.gold,
          stone: b.stone,
          order: b.order,
          paused: b.paused,
          result: b.result,
          doors: b.doors,
          miners: b.miners,
          units: b.units,
          towers: b.towers,
          projectiles: b.projectiles.length,
          wave: b.wave,
          renderObjects: this.children.length,
        }
      : null;
  }
  update(_time: number, delta: number) {
    this.ui?.tick();
    const dt = Math.min(delta / 1000, 0.05);
    if (!this.battle) {
      this.audioDirector.update(dt);
      return;
    }
    const b = this.battle;
    if (!b.paused && !b.result) {
      if (this.intro > 0) this.intro -= dt;
      else b.advance(dt);
      this.audioDirector.update(dt);
      this.mineClock += dt;
      if (this.mineClock > 0.65) {
        this.mineClock = 0;
        if (b.miners.some((m) => m.state === "mine"))
          this.audioDirector.effect("mine");
      }
    }
    if (this.panTarget !== null && !b.paused) {
      const c = this.cameras.main;
      if (this.ui.reduced) c.scrollX = this.panTarget;
      else
        c.scrollX = Phaser.Math.Linear(
          c.scrollX,
          this.panTarget,
          Math.min(1, dt * (this.intro > 0 ? 2.4 : 8)),
        );
      if (Math.abs(c.scrollX - this.panTarget) < 1) this.panTarget = null;
    }
    if (this.keys && !b.paused) {
      const dir =
        (this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0) -
        (this.keys.A.isDown || this.keys.LEFT.isDown ? 1 : 0);
      if (dir) {
        this.intro = 0;
        this.panTarget = null;
        this.cameras.main.scrollX += dir * 700 * dt;
      }
    }
    this.clampCamera();
    for (const event of b.drain()) this.event(event);
    this.sync(b.paused || b.result ? 0 : dt);
    this.hudClock += dt;
    if (this.hudClock > 0.12) {
      this.ui.update();
      this.hudClock = 0;
    }
    if (b.result) this.ui.result();
  }
  event(e: GameEvent) {
    const b = this.battle!;
    this.audioDirector.effect(e.type, e.kind);
    if (e.type === "wave") this.ui.wave(e.kind!);
    if (e.type === "delivery")
      this.floatText(
        e.x,
        390,
        `+${B.deliveryGold} oro · +${B.deliveryStone} piedra`,
        "#fff1a3",
      );
    if (e.type === "recruit") this.burst(e.x, 455, 0xeec86a, 12);
    if (e.type === "build") this.burst(e.x, 440, 0xffe4a3, 18);
    if (e.type === "hit") {
      this.burst(
        e.x,
        440,
        e.kind === "fire" ? 0xfbab61 : e.kind === "magic" ? 0x92e1d8 : 0xf8e3a3,
        5,
      );
      if (this.floaters.length < 16)
        this.floatText(e.x, 400, `−${e.amount}`, "#fff3d4");
    }
    if (e.type === "door") {
      this.burst(e.x, 420, 0xc19a69, 35);
      this.floatText(e.x, 320, "¡PUERTA ROTA!", "#ffe69b");
      if (!this.ui.reduced) this.cameras.main.shake(220, 0.003);
    }
    if (e.type === "result") {
      this.focusCastle(e.side === "hero");
      this.burst(e.x, 380, e.side === "hero" ? 0xf7d575 : 0xad6c80, 40);
    }
    // Event timestamps are simulation timestamps, so a pause freezes effects too.
    void b;
  }
  burst(x: number, y: number, color: number, n: number) {
    if (this.ui.reduced) n = Math.min(n, 3);
    for (let i = 0; i < n && this.particles.length < 240; i++) {
      const a = i * 2.399;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * (30 + i * 3),
        vy: -40 - Math.abs(Math.sin(a)) * 100,
        life: 0.55 + (i % 4) * 0.1,
        max: 0.85,
        color,
        size: 2 + (i % 4),
      });
    }
  }
  floatText(x: number, y: number, value: string, color: string) {
    const text = this.add
      .text(x, y, value, {
        fontFamily: "sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        color,
        stroke: "#345060",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(40);
    this.floaters.push({ text, until: this.battle!.time + 1.3 });
  }
  sync(dt: number) {
    const b = this.battle;
    if (!b) return;
    this.ink.clear();
    this.effects.clear();
    for (const [i, c] of this.clouds.entries())
      if (!this.ui.reduced && !b.paused)
        c.x =
          ((80 + Math.floor(i / 2) * 340 + (i % 2) * 24 + b.time * 1.2) %
            (B.worldWidth + 180)) -
          40;
    for (const u of b.units) {
      let f = this.figures.get(u.id);
      if (!f) {
        f = {
          image: this.add.image(u.x, 480, `${u.kind}-0`).setOrigin(0.5, 1),
          shadow: this.add.ellipse(u.x, 480, 48, 12, 0x263f43, 0.19),
        };
        this.figures.set(u.id, f);
      }
      const hidden = u.state === "hidden";
      f.image.setVisible(!hidden);
      f.shadow.setVisible(!hidden);
      if (hidden) continue;
      const s = UNITS[u.kind],
        moving = u.state === "walk",
        attacking = u.attackUntil > b.time;
      const frame = attacking
        ? 5
        : moving
          ? 1 +
            ((Math.floor(b.time * (u.kind === "cerbero" ? 12 : 8)) + u.id) % 4)
          : 0;
      const stride =
        moving && !this.ui.reduced
          ? Math.abs(Math.sin(b.time * 10 + u.id)) * 3
          : !this.ui.reduced
            ? Math.sin(b.time * 2 + u.id)
            : 0;
      const lunge =
        attacking && !this.ui.reduced
          ? Math.sin(((u.attackUntil - b.time) / 0.45) * Math.PI) * 7 * u.face
          : 0;
      f.image
        .setTexture(`${u.kind}-${frame}`)
        .setDisplaySize((s.size * 160) / 170, s.size)
        .setPosition(u.x + lunge, B.ground + u.y - stride)
        .setFlipX(u.face < 0)
        .setDepth(10 + u.y / 10)
        .setAlpha(1);
      f.shadow
        .setPosition(u.x, B.ground + u.y - 3)
        .setSize(s.size * 0.5, 10)
        .setDepth(6);
      if (
        u.hitUntil > b.time &&
        u.hitUntil - b.time > B.healthBarSeconds - 0.12
      )
        f.image.setTint(0xffd8b8);
      else f.image.clearTint();
      if (u.hitUntil > b.time || u.state === "attack")
        this.healthBar(
          u.x,
          B.ground + u.y - s.size - 9,
          u.health / u.maxHealth,
          u.side === "hero" ? 0x73b9b5 : 0xd5807b,
          42,
        );
      if (attacking && !this.ui.reduced && s.shot === "melee") {
        this.effects.lineStyle(
          u.kind === "hercules" ? 5 : 3,
          u.kind === "hercules" ? 0xf3d9a6 : 0xffe09c,
          0.7,
        );
        this.effects.beginPath();
        this.effects.arc(
          u.x + u.face * 24,
          B.ground + u.y - s.size * 0.45,
          30,
          -1.2,
          1.1,
        );
        this.effects.strokePath();
      }
    }
    for (const [id, f] of this.figures) {
      if (b.units.some((u) => u.id === id)) continue;
      if (f.death === undefined) f.death = b.time;
      const progress = (b.time - f.death) / 0.4;
      f.image.setAlpha(Math.max(0, 1 - progress)).setAngle(progress * 65);
      f.shadow.setAlpha(Math.max(0, 0.2 * (1 - progress)));
      if (progress >= 1) {
        f.image.destroy();
        f.shadow.destroy();
        this.figures.delete(id);
      }
    }
    for (const [i, m] of b.miners.entries()) {
      const frame =
        m.state === "mine"
          ? Math.floor(b.time * 4 + i) % 2
            ? 5
            : 0
          : 1 + (Math.floor(b.time * 8 + i) % 4);
      this.miners[i]
        .setTexture(`miner-${frame}`)
        .setPosition(m.x, 456 + i * 12)
        .setFlipX(m.state === "back");
      this.minerLabels[i].setPosition(m.x, 466 + i * 12);
      if (m.load > 0) {
        this.ink.fillStyle(0xefc65e);
        this.ink.fillCircle(
          m.x + (m.state === "back" ? 10 : -10),
          425 + i * 12,
          3 + m.load * 2,
        );
        this.ink.fillStyle(0xc6cec3);
        this.ink.fillCircle(
          m.x + (m.state === "back" ? 16 : -16),
          426 + i * 12,
          3,
        );
      }
    }
    for (const t of b.towers) {
      let image = this.towerImages.get(t.id);
      if (!image) {
        image = this.add
          .image(t.x, 488, `tower-${t.kind}`)
          .setOrigin(0.5, 1)
          .setDisplaySize(98, 134)
          .setDepth(1);
        image.setInteractive({ useHandCursor: true });
        image.on("pointerdown", () => {
          this.armedSlot = t.slot;
        });
        image.on("pointerup", () => {
          if (this.armedSlot === t.slot && !this.dragged)
            this.ui.openTower(t.slot);
          this.armedSlot = null;
        });
        this.towerImages.set(t.id, image);
      }
      if (t.hitUntil > b.time)
        this.healthBar(t.x, 340, t.health / t.maxHealth, 0x8cbab5, 55);
    }
    for (const [id, image] of this.towerImages) {
      if (!b.towers.some((t) => t.id === id)) {
        image.destroy();
        this.towerImages.delete(id);
      }
    }
    for (const [i, slot] of this.slots.entries()) {
      const built = b.towers.some((t) => t.slot === i);
      (slot.list[2] as Phaser.GameObjects.Text).setText(built ? "⚙" : "+");
      slot.setAlpha(built ? 0.65 : 1);
    }
    for (const [i, d] of b.doors.entries()) {
      const stage =
        d.health <= 0
          ? 3
          : d.health < d.maxHealth * 0.35
            ? 2
            : d.health < d.maxHealth * 0.7
              ? 1
              : 0;
      this.doorImages[i].setTexture(`door-${stage}`);
    }
    for (const p of b.projectiles) {
      if (p.shot === "melee") continue;
      const source = b.units.find((u) => u.id === p.source),
        isTower = b.towers.some((t) => t.id === p.source);
      const target = b.target(p.targetId);
      const sy = isTower
        ? 360
        : B.ground - (source ? UNITS[source.kind].size * 0.55 : 55);
      const ty =
        target && "kind" in target && target.kind in UNITS
          ? B.ground - UNITS[target.kind as Unit["kind"]].size * 0.5
          : 420;
      const progress = 1 - p.remaining / p.total;
      const y = sy + (ty - sy) * progress - Math.sin(progress * Math.PI) * 32;
      const color =
        p.shot === "arrow" ? 0x5d5040 : p.shot === "fire" ? 0xffab53 : 0x8de1e0;
      this.effects.lineStyle(p.shot === "arrow" ? 2 : 4, color, 0.65);
      const dir = Math.sign(p.targetX - p.startX);
      this.effects.lineBetween(p.x - dir * 18, y + 3, p.x, y);
      if (p.shot === "arrow") {
        this.effects.fillStyle(0xe9efdc);
        this.effects.fillTriangle(
          p.x,
          y,
          p.x - dir * 9,
          y - 4,
          p.x - dir * 8,
          y + 5,
        );
      } else {
        this.effects.fillStyle(color, 0.2);
        this.effects.fillCircle(p.x, y, 13);
        this.effects.fillStyle(color, 1);
        this.effects.fillCircle(p.x, y, 7);
        this.effects.fillStyle(0xfff4ce);
        this.effects.fillCircle(p.x + 2, y - 2, 3);
      }
    }
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      this.effects.fillStyle(p.color, Math.max(0, p.life / p.max));
      this.effects.fillRect(p.x, p.y, p.size, p.size);
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) {
      f.text.y -= dt * 20;
      f.text.setAlpha(Math.max(0, Math.min(1, f.until - b.time)));
      if (b.time > f.until) f.text.destroy();
    }
    this.floaters = this.floaters.filter((f) => f.until > b.time);
  }
  healthBar(x: number, y: number, ratio: number, color: number, width: number) {
    this.ink.fillStyle(0x273d4b, 0.85);
    this.ink.fillRoundedRect(x - width / 2 - 2, y - 2, width + 4, 8, 3);
    this.ink.fillStyle(color);
    this.ink.fillRoundedRect(
      x - width / 2,
      y,
      width * Math.max(0, ratio),
      4,
      2,
    );
  }
}
