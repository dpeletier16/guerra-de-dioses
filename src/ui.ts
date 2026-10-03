import {
  BALANCE as B,
  HEROES,
  MONSTERS,
  TOWERS,
  type HeroKind,
  type Order,
  type TowerKind,
} from "./config";
import { Battle } from "./model";
import { AudioDirector, stored, save } from "./audio";
import { icon } from "./art";
export interface ViewPort {
  startBattle: (names: string[]) => void;
  showWorld: () => void;
  camera: (enemy: boolean) => void;
  pause: (value: boolean) => void;
}
const img = (key: string, cls = "", alt = "") =>
  `<img class="${cls}" src="${import.meta.env.BASE_URL}art/${key}.svg" alt="${alt}" draggable="false">`;
const button = (id: string, label: string, cls = "") =>
  `<button id="${id}" class="${cls}">${label}</button>`;
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export class Interface {
  root = document.querySelector<HTMLDivElement>("#ui")!;
  global = document.querySelector<HTMLDivElement>("#global")!;
  battle?: Battle;
  screen = "loading";
  slot: number | null = null;
  toastUntil = 0;
  names = stored("names", ["Nico", "Leo"]);
  reduced = stored(
    "reduced",
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  tutorialStep = 0;
  tutorial = true;
  lastStatus = "";
  constructor(
    public audio: AudioDirector,
    public view: ViewPort,
  ) {
    this.global.innerHTML =
      button("sound", "", "utility") +
      button("motion", "", "utility") +
      button("fullscreen", "⛶", "utility");
    this.on("sound", () => {
      audio.toggle();
      this.settings();
    });
    this.on("motion", () => {
      this.reduced = !this.reduced;
      save("reduced", this.reduced);
      this.settings();
    });
    this.on("fullscreen", () => {
      if (document.fullscreenElement)
        void document
          .exitFullscreen()
          .catch(() => this.toast("Pantalla completa no disponible"));
      else
        void document.documentElement
          .requestFullscreen?.()
          .catch(() => this.toast("Pantalla completa no disponible"));
    });
    document
      .querySelector("#fullscreen")
      ?.setAttribute("aria-label", "Pantalla completa");
    this.settings();
  }
  settings() {
    document.body.classList.toggle("reduced-motion", this.reduced);
    const sound = document.querySelector<HTMLButtonElement>("#sound")!,
      motion = document.querySelector<HTMLButtonElement>("#motion")!;
    sound.textContent = this.audio.muted ? "♫ Sonido: no" : "♫ Sonido: sí";
    sound.setAttribute("aria-pressed", String(!this.audio.muted));
    motion.textContent = this.reduced
      ? "Efectos: suaves"
      : "Efectos: completos";
    motion.setAttribute("aria-pressed", String(this.reduced));
  }
  on(id: string, fn: () => void) {
    document.getElementById(id)?.addEventListener("click", () => {
      this.audio.unlock();
      fn();
    });
  }
  loading(progress = 0) {
    this.root.innerHTML = `<section class="loading"><div class="eyebrow">EL JUEGO DE DAVID</div><h2>Preparando el Olimpo</h2><div class="loadbar"><i style="width:${progress * 100}%"></i></div></section>`;
  }
  menu() {
    this.screen = "menu";
    this.battle = undefined;
    this.slot = null;
    document.body.dataset.screen = "menu";
    this.view.showWorld();
    this.root.innerHTML = `<section class="menu screen"><div class="menu-copy"><div class="eyebrow"><span class="line"></span> UNA AVENTURA DE DAVID</div><h1>GUERRA<br>DE <em>DIOSES</em></h1><div class="subtitle">EL ASEDIO DEL OLIMPO</div><p>Cinco héroes. Una fortaleza.<br>Una leyenda que está en tus manos.</p>${button("play", "Comenzar la aventura <span>→</span>", "primary big")}${button("help", "Cómo se juega", "text-button")}<div class="menu-note">ESTRATEGIA · MITOLOGÍA · AVENTURA</div></div><div class="hero-stage" aria-label="Los cinco héroes griegos"><div class="sun-disc"></div>${img("atalanta-0", "hero atalanta", "Atalanta con arco")}${img("medea-0", "hero medea", "Medea con bastón")}${img("hercules-0", "hero hercules", "Hércules con piel de león")}${img("perseo-0", "hero perseo", "Perseo con hoz")}${img("aquiles-0", "hero aquiles", "Aquiles con espada y escudo")}<div class="hero-caption"><span>LOS HÉROES TE ESPERAN</span><i>Reúne tu ejército y escribe la historia.</i></div></div><footer>IDEA Y DIRECCIÓN CREATIVA: DAVID <span>01 / EL VALLE DEL OLIMPO</span></footer></section>`;
    this.on("play", () => this.map());
    this.on("help", () => this.help());
  }
  help() {
    const el = document.createElement("div");
    el.className = "modal-backdrop";
    el.innerHTML = `<section class="modal help"><div class="eyebrow">TU PRIMERA BATALLA</div><h2>Una leyenda, paso a paso</h2><div class="help-grid"><article><b>01</b><h3>Reúne recursos</h3><p>Dos campesinos llevan oro y piedra desde la mina. Ponles nombre y déjalos trabajar.</p></article><article><b>02</b><h3>Forma tu ejército</h3><p>Compra héroes con oro. Cada uno tiene un arma, una velocidad y una función diferentes.</p></article><article><b>03</b><h3>Protege el castillo</h3><p>Construye torres con piedra. Puedes desmontarlas y recuperar toda la piedra, o cambiar piedra por oro.</p></article><article><b>04</b><h3>Dirige el asedio</h3><p>Refúgiate, defiende o ataca. Para ganar, rompe la puerta roja <strong>y entra con un héroe vivo</strong>.</p></article></div><p class="hint">Arrastra el terreno para mirar alrededor · 1 / 2 / 3: órdenes · A / D: cámara · Esc: pausa · M: sonido</p>${button("close-help", "¡Entendido!", "primary")}</section>`;
    this.root.append(el);
    this.on("close-help", () => el.remove());
  }
  map() {
    this.screen = "map";
    this.battle = undefined;
    this.slot = null;
    document.body.dataset.screen = "map";
    this.view.showWorld();
    this.root.innerHTML = `<section class="map screen"><header><div class="eyebrow">EL MUNDO DE DAVID</div><h2>El valle del Olimpo</h2><p>Dos ejércitos se encuentran. Tu aventura comienza aquí.</p></header><div class="map-art">${img("map", "map-image")}<div class="map-castle ally">${img("castle-home")}<span>TU FORTALEZA</span></div><div class="map-castle enemy">${img("castle-enemy")}<span>LOS MONSTRUOS</span></div><div class="flag flag-blue"><i></i></div><div class="flag flag-red"><i></i></div><button id="encounter" aria-label="Espada y escudo: iniciar batalla" class="encounter">${icon("attack")}${icon("defend")}</button><div class="encounter-label"><b>EL ENCUENTRO</b><span>Pulsa para preparar la batalla</span></div></div>${button("back-menu", "← Volver al inicio", "back text-button")}<div class="map-bottom">UNA BATALLA · CINCO HÉROES · TU ESTRATEGIA</div></section>`;
    this.on("back-menu", () => this.menu());
    this.on("encounter", () => this.prepare());
  }
  prepare() {
    const el = document.createElement("div");
    el.className = "modal-backdrop";
    el.innerHTML = `<form class="modal preparation"><div class="eyebrow">ANTES DE PARTIR</div><h2>Conoce a tus campesinos</h2><p>Ellos traerán el oro y la piedra. ¿Cómo se llaman?</p><div class="miners-form">${this.names
      .slice(0, 2)
      .map(
        (name: string, i: number) =>
          `<label>${img("miner-5")}<span>Campesino ${i + 1}</span><input id="miner-${i}" value="${escape(name)}" placeholder="${i ? "Leo" : "Nico"}" maxlength="18" autocomplete="off"></label>`,
      )
      .join(
        "",
      )}</div><p class="hint">Son dos, son gratis y comienzan a trabajar solos.</p><button class="primary" type="submit">A la batalla <span>→</span></button>${button("cancel-prepare", "Volver al mapa", "text-button")}</form>`;
    this.root.append(el);
    el.querySelector("form")!.addEventListener("submit", (e) => {
      e.preventDefault();
      this.names = [0, 1].map((i) =>
        (
          document
            .querySelector<HTMLInputElement>(`#miner-${i}`)!
            .value.trim() || ["Nico", "Leo"][i]
        ).slice(0, 18),
      );
      save("names", this.names);
      this.audio.unlock();
      this.view.startBattle(this.names);
    });
    this.on("cancel-prepare", () => el.remove());
  }
  hud(b: Battle) {
    this.battle = b;
    this.screen = "battle";
    this.slot = null;
    this.tutorialStep = 0;
    this.tutorial = true;
    document.body.dataset.screen = "battle";
    this.root.innerHTML = `<section class="battle-ui"><header class="battle-top"><div class="battle-brand"><span class="eyebrow">GUERRA DE DIOSES</span><strong>El valle del Olimpo</strong></div><div class="resources"><div>${icon("gold")}<span><small>ORO</small><b id="gold">${b.gold}</b></span></div><div>${icon("stone")}<span><small>PIEDRA</small><b id="stone">${b.stone}</b></span></div></div><div class="battle-clock"><b id="clock">00:00</b><small id="wave">Preparación</small></div>${button("pause", "Ⅱ Pausa", "secondary")}</header><div class="door-hud"><div><span>Tu puerta</span><meter id="home-hp" min="0" max="${B.doorHealth}" value="${B.doorHealth}"></meter><small id="home-value"></small></div><div><span>Puerta enemiga</span><meter id="enemy-hp" min="0" max="${B.doorHealth}" value="${B.doorHealth}"></meter><small id="enemy-value"></small></div></div><div id="tutorial" class="tutorial"></div><div class="camera-controls">${button("camera-home", "← Mi castillo")}<span>Arrastra el terreno para explorar</span>${button("camera-enemy", "Castillo enemigo →")}</div><aside id="tower-panel"></aside><div class="battle-bottom"><section class="orders"><div class="panel-label">ÓRDENES DEL EJÉRCITO <span id="army-count">0 / ${B.heroLimit}</span></div><div class="order-buttons">${(["shelter", "defend", "attack"] as Order[]).map((o, i) => button(`order-${o}`, `${icon(o)}<span>${["Refugiarse", "Defender", "Atacar"][i]}</span><kbd>${i + 1}</kbd>`, o === "defend" ? "active" : "")).join("")}</div><div id="order-description" class="order-description"></div></section><section class="recruitment"><div class="panel-label">RECLUTA A TUS HÉROES <span>Se compran con oro</span></div><div class="hero-cards">${Object.entries(
      HEROES,
    )
      .map(([k, s]) =>
        button(
          `recruit-${k}`,
          `${img(`${k}-0`)}<span class="hero-name">${s.name}</span><span class="cost">${icon("gold")}${s.cost}</span><small class="availability"></small>`,
          "hero-card",
        ),
      )
      .join(
        "",
      )}</div></section><section class="economy"><div class="panel-label">EL INTERCAMBIO</div>${button("convert", `${icon("stone")} ${B.conversionStone} <span>→</span> ${icon("gold")} ${B.conversionGold}`, "exchange")}<small id="exchange-hint">Cambiar piedra por oro</small></section></div></section><div id="modal-layer"></div>`;
    this.on("pause", () => this.togglePause());
    this.on("camera-home", () => this.view.camera(false));
    this.on("camera-enemy", () => this.view.camera(true));
    for (const k of Object.keys(HEROES) as HeroKind[]) {
      document.getElementById(`recruit-${k}`)!.title = HEROES[k].role;
      this.on(`recruit-${k}`, () => {
        const error = b.recruit(k);
        if (error) this.toast(error);
        this.update();
      });
    }
    for (const o of ["shelter", "defend", "attack"] as Order[])
      this.on(`order-${o}`, () => {
        b.setOrder(o);
        this.update();
      });
    this.on("convert", () => {
      if (!b.convert()) this.toast("Necesitas 60 de piedra");
      this.update();
    });
    this.renderTutorial();
    this.update();
  }
  renderTutorial() {
    const el = document.querySelector("#tutorial");
    if (!el) return;
    if (!this.tutorial) {
      el.innerHTML = "";
      return;
    }
    const steps = [
      [
        "Los campesinos ya están trabajando",
        "El oro y la piedra se suman cuando entregan su carga en el castillo.",
      ],
      [
        "Elige a tus héroes",
        "Compra con los botones de abajo. Aquiles es un buen primer defensor.",
      ],
      [
        "Levanta tus defensas",
        "Pulsa un círculo + del terreno para construir una torre con piedra.",
      ],
      [
        "¡Dirige el asedio!",
        "Ordena Atacar. Rompe la puerta enemiga y entra para ganar.",
      ],
    ];
    el.innerHTML = `<span class="tutorial-number">${this.tutorialStep + 1}/4</span><div><b>${steps[this.tutorialStep][0]}</b><p>${steps[this.tutorialStep][1]}</p></div>${button("next-tip", this.tutorialStep === 3 ? "¡A jugar!" : "Siguiente →", "text-button")}${button("skip-tip", "×", "skip")}`;
    this.on("next-tip", () => {
      if (this.tutorialStep < 3) this.tutorialStep++;
      else this.tutorial = false;
      this.renderTutorial();
    });
    this.on("skip-tip", () => {
      this.tutorial = false;
      this.renderTutorial();
    });
  }
  update() {
    const b = this.battle;
    if (!b || this.screen !== "battle") return;
    const set = (id: string, t: string) => {
      const el = document.getElementById(id);
      if (el && el.textContent !== t) el.textContent = t;
    };
    set("gold", String(b.gold));
    set("stone", String(b.stone));
    set(
      "clock",
      `${Math.floor(b.time / 60)
        .toString()
        .padStart(2, "0")}:${Math.floor(b.time % 60)
        .toString()
        .padStart(2, "0")}`,
    );
    set(
      "wave",
      b.wave
        ? `Oleada ${b.wave} · próxima en ${Math.max(0, Math.ceil(b.nextWave - b.time))} s`
        : `Primera amenaza en ${Math.ceil(b.nextWave - b.time)} s`,
    );
    set("army-count", `${b.armySize} / ${B.heroLimit}`);
    for (const [i, k] of ["home", "enemy"].entries()) {
      const door = b.doors[i];
      (document.getElementById(`${k}-hp`) as HTMLMeterElement).value =
        door.health;
      set(
        `${k}-value`,
        door.health > 0
          ? `${Math.ceil(door.health)} / ${door.maxHealth}`
          : "Puerta rota · acceso abierto",
      );
    }
    for (const [k, s] of Object.entries(HEROES)) {
      const el = document.getElementById(`recruit-${k}`) as HTMLButtonElement;
      const reason =
        b.armySize >= B.heroLimit
          ? "Ejército completo"
          : b.gold < s.cost
            ? `Faltan ${s.cost - b.gold} oro`
            : "Reclutar";
      el.disabled =
        b.paused || !!b.result || b.gold < s.cost || b.armySize >= B.heroLimit;
      el.querySelector(".availability")!.textContent = reason;
      el.setAttribute(
        "aria-label",
        `${s.name}, ${s.cost} oro. ${s.role}. ${reason}`,
      );
    }
    for (const o of ["shelter", "defend", "attack"]) {
      const el = document.getElementById(`order-${o}`) as HTMLButtonElement;
      el.classList.toggle("active", o === b.order);
      el.setAttribute("aria-pressed", String(o === b.order));
      el.disabled = b.paused || !!b.result;
    }
    set(
      "order-description",
      b.order === "attack"
        ? "Avanzan, combaten y asedian la puerta roja."
        : b.order === "defend"
          ? "Protegen la zona azul frente a tu castillo."
          : "Vuelven al castillo. La puerta no se repara.",
    );
    (document.getElementById("convert") as HTMLButtonElement).disabled =
      b.stone < B.conversionStone || b.paused || !!b.result;
    set(
      "exchange-hint",
      b.stone < B.conversionStone
        ? `Faltan ${B.conversionStone - b.stone} de piedra`
        : "Cambiar piedra por oro",
    );
    if (this.slot !== null) this.refreshTower();
  }
  openTower(slot: number) {
    if (!this.battle || this.battle.paused || this.battle.result) return;
    this.slot = slot;
    this.lastStatus = "";
    this.refreshTower();
  }
  refreshTower() {
    const b = this.battle!,
      slot = this.slot!;
    const t = b.towers.find((t) => t.slot === slot),
      signature = `${slot}:${t?.id}:${Math.ceil(t?.health ?? 0)}:${b.stone}`;
    if (signature === this.lastStatus) return;
    this.lastStatus = signature;
    const el = document.getElementById("tower-panel")!;
    el.innerHTML = `<div class="tower-popup"><div class="panel-label">EMPLAZAMIENTO ${slot + 1} ${button("close-tower", "×", "skip")}</div>${
      t
        ? `<h3>${TOWERS[t.kind].name}</h3><p>Integridad: ${Math.ceil(t.health)} / ${t.maxHealth}</p>${button("dismantle", `Desmontar · +${Math.floor(t.paid * B.refundRatio)} piedra`, "secondary")}`
        : `<h3>Construye una torre</h3><div class="tower-options">${Object.entries(
            TOWERS,
          )
            .map(
              ([k, s]) =>
                `<button id="build-${k}" ${b.stone < s.cost ? "disabled" : ""}>${img(`tower-${k}`)}<b>${s.name.replace("Torre de ", "")}</b><span>${icon("stone")} ${s.cost}</span><small>${b.stone < s.cost ? "Falta piedra" : "Construir"}</small></button>`,
            )
            .join("")}</div>`
    }<small class="hint">La batalla continúa mientras eliges.</small></div>`;
    this.on("close-tower", () => this.closeTower());
    this.on("dismantle", () => {
      b.dismantle(slot);
      this.closeTower();
      this.update();
    });
    for (const kind of Object.keys(TOWERS) as TowerKind[])
      this.on(`build-${kind}`, () => {
        const err = b.build(slot, kind);
        if (err) this.toast(err);
        else this.closeTower();
        this.update();
      });
  }
  closeTower() {
    this.slot = null;
    const el = document.getElementById("tower-panel");
    if (el) el.innerHTML = "";
  }
  togglePause(force?: boolean) {
    const b = this.battle;
    if (!b || b.result || this.screen !== "battle") return;
    b.paused = force ?? !b.paused;
    this.view.pause(b.paused);
    this.closeTower();
    const layer = document.getElementById("modal-layer")!;
    if (b.paused) {
      layer.innerHTML = `<div class="modal-backdrop"><section class="modal pause-modal"><div class="eyebrow">RESPIRA, ESTRATEGA</div><h2>Batalla en pausa</h2><p>El ejército, los campesinos y el tiempo te esperan.</p>${button("resume", "Continuar la batalla", "primary")}${button("pause-help", "Cómo se juega", "secondary")}${button("quit", "Volver al mapa", "text-button")}</section></div>`;
      this.on("resume", () => this.togglePause());
      this.on("pause-help", () => this.help());
      this.on("quit", () => {
        this.view.pause(false);
        this.map();
      });
    } else layer.innerHTML = "";
    this.update();
  }
  result() {
    const b = this.battle;
    if (!b || !b.result || this.screen === "result") return;
    this.screen = "result";
    this.closeTower();
    const win = b.result === "hero";
    this.audio.effect(win ? "win" : "lose");
    document.getElementById("modal-layer")!.innerHTML =
      `<div class="modal-backdrop result-backdrop"><section class="modal result ${win ? "win" : "lose"}"><div class="result-emblem">${icon(win ? "defend" : "shelter")}</div><div class="eyebrow">EL VALLE DEL OLIMPO</div><h2>${win ? "¡La victoria es tuya!" : "Tu fortaleza ha caído"}</h2><p>${win ? "Tus héroes rompieron la puerta y entraron en el castillo enemigo." : "Los monstruos rompieron tu puerta y entraron en el castillo."}</p><div class="result-stats"><div><strong>${Math.floor(b.time / 60)}:${Math.floor(
        b.time % 60,
      )
        .toString()
        .padStart(
          2,
          "0",
        )}</strong><span>TIEMPO</span></div><div><strong>${b.recruited}</strong><span>HÉROES RECLUTADOS</span></div><div><strong>${b.kills}</strong><span>MONSTRUOS VENCIDOS</span></div></div>${button("retry", "Volver a jugar", "primary")}${button("result-map", "Volver al mapa", "secondary")}<small>${win ? "Una nueva leyenda, imaginada por David." : "Consejo: combina un héroe resistente con arqueras y torres."}</small></section></div>`;
    this.on("retry", () => this.view.startBattle(this.names));
    this.on("result-map", () => this.map());
  }
  toast(message: string) {
    const el = document.querySelector<HTMLDivElement>("#toast")!;
    el.textContent = message;
    el.classList.add("visible");
    this.toastUntil = performance.now() + 3500;
  }
  tick() {
    if (performance.now() > this.toastUntil)
      document.querySelector("#toast")?.classList.remove("visible");
  }
  wave(kind: string) {
    this.toast(
      `Sale del castillo rojo: ${MONSTERS[kind as keyof typeof MONSTERS]?.name ?? kind}`,
    );
  }
}
