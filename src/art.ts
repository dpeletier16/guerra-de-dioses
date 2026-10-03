// Original vector art. All geometry is authored for this project; photographs are never loaded.
const ink = "#293442",
  skin = "#e7ae79",
  gold = "#e9b94e";
const path = (d: string, fill: string, stroke = ink, w = 3) =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const ellipse = (
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  stroke = ink,
  w = 3,
) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  r = 0,
) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${ink}" stroke-width="3"/>`;
const group = (body: string, transform: string) =>
  `<g transform="${transform}">${body}</g>`;
export const svg = (body: string, w = 160, h = 170) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const eye = (x: number, y: number) =>
  ellipse(x, y, 6, 7, "#fff9e8", ink, 1.5) +
  ellipse(x + 2, y, 2.5, 3.5, ink, ink, 0);
const fist = (x: number, y: number, s = 1) =>
  group(
    ellipse(0, 0, 12, 12, skin) +
      path("M-5 -6V2M1 -7V1M7 -4V2", "none", "#aa7350", 1.5),
    `translate(${x} ${y}) scale(${s})`,
  );
function leg(x: number, angle: number, color: string) {
  return group(
    path("M-7 0 L8 0 10 28 17 36 Q17 43 2 41 L-7 35Z", skin) +
      path("M-7 26L10 27 17 36 Q17 43 2 41L-7 35Z", color) +
      path("M-6 20L8 23M-6 14L8 17", "none", color, 4),
    `translate(${x} 120) rotate(${angle})`,
  );
}
export function character(kind: string, frame = 0): string {
  const walk =
      frame >= 1 && frame <= 4 ? Math.sin(((frame - 1) * Math.PI) / 2) * 24 : 0,
    attack = frame === 5;
  let body = "";
  const large = [
    "hercules",
    "minotauro",
    "ciclope",
    "centimano",
    "cronos",
  ].includes(kind);
  if (kind === "cerbero") {
    body = path("M35 104Q7 95 19 68Q-4 88 15 112", "none", "#61465f", 10);
    for (const [i, x] of [40, 62, 99, 117].entries())
      body += group(
        path("M-7 0L9 0 5 28 15 30 14 38-8 38Z", "#74546b") +
          path("M-5 33L11 33", "none", "#e4bd98", 2),
        `translate(${x} 112) rotate(${i % 2 ? walk : -walk})`,
      );
    body +=
      ellipse(77, 101, 51, 27, "#69475b") +
      path("M35 91Q67 65 112 89L105 113 42 116Z", "#8e5a69");
    for (let i = 0; i < 3; i++) {
      const x = [61, 97, 126][i],
        y = [83, 47, 90][i];
      body += group(
        path(
          "M-18 -12L-24 -35-5 -22 13 -27 18 -7 30 1 29 17 5 22-17 7Z",
          i === 1 ? "#ad746f" : "#825267",
        ) +
          ellipse(21, 3, 9, 6, "#342f40") +
          eye(6, -9) +
          path("M5 13L11 22 15 13M20 12L22 20 26 11", "#fff2c7", ink, 1.5),
        `translate(${x} ${y}) rotate(${attack ? -12 : i === 1 ? walk / 5 : 0})`,
      );
    }
    body +=
      path("M39 83L51 75 65 79 69 91 54 94Z", gold) +
      ellipse(55, 86, 3, 3, "#fff5c9", ink, 0);
  } else {
    const color =
      kind === "atalanta"
        ? "#647658"
        : kind === "medea"
          ? "#8d375a"
          : kind === "perseo"
            ? "#388d91"
            : kind === "cronos"
              ? "#424965"
              : kind === "miner"
                ? "#476b80"
                : "#324d69";
    body +=
      leg(large ? 60 : 65, walk, color) + leg(large ? 98 : 89, -walk, color);
    if (kind === "centimano")
      for (const side of [-1, 1])
        for (let i = 0; i < 6; i++) {
          const x = 80 + side * 65,
            y = 17 + i * 23 + (attack ? (i % 2 ? 8 : -8) : 0);
          const arm = `M${80 + side * 25} ${68 + i * 6} Q${80 + side * 52} ${39 + i * 17} ${x} ${y}`;
          body +=
            path(arm, "none", ink, 11) +
            path(arm, "none", i % 2 ? "#789995" : "#537d83", 7) +
            ellipse(x, y, 7, 7, "#91ada2", ink, 2) +
            path(
              `M${x - 3} ${y - 3}v5M${x + 1} ${y - 4}v5`,
              "none",
              "#466471",
              1,
            );
        }
    if (kind === "medea")
      body += path(
        "M53 37Q45 70 44 136L64 127 73 145 106 132 108 48Z",
        "#d7ab53",
      );
    if (kind === "atalanta")
      body +=
        path("M54 35Q23 26 34 63Q18 88 42 102L64 101 94 55 98 28Z", "#573c44") +
        group(
          rect(25, 61, 15, 57, "#a97844", 4) +
            path("M30 60L25 39M37 61L34 37M43 62L43 40", "none", "#ece1b9", 3) +
            path(
              "M22 42L24 33 29 39M31 38L34 29 38 36M39 42L43 33 47 40",
              "#dedfcf",
              ink,
              1,
            ),
          `rotate(-15 38 83)`,
        );
    if (kind === "cronos")
      body += path("M51 64L29 135 111 145 137 115 113 62Z", "#663e63");
    if (["minotauro", "ciclope", "centimano", "hercules"].includes(kind)) {
      const flesh =
        kind === "minotauro"
          ? "#9e6250"
          : kind === "centimano"
            ? "#789995"
            : kind === "ciclope"
              ? "#b7a47c"
              : skin;
      body +=
        path("M43 68Q80 51 116 68L113 111 96 128 58 125 43 104Z", flesh) +
        ellipse(48, 80, 18, 23, flesh) +
        ellipse(111, 80, 18, 23, flesh) +
        path(
          "M60 84Q69 91 80 84Q91 91 103 82M80 88V108",
          "none",
          kind === "hercules" ? "#b67c54" : "#536264",
          2,
        ) +
        path(
          "M49 110L113 110 118 131 43 131Z",
          kind === "hercules" ? "#a85b43" : "#655165",
        ) +
        rect(49, 109, 63, 8, gold, 2);
      body +=
        group(
          path("M104 76Q120 86 131 76", "none", flesh, 17) +
            fist(132, 75, 1.15),
          `rotate(${attack ? -45 : 8} 105 76)`,
        ) +
        group(
          path("M49 76L34 101", "none", flesh, 17) + fist(34, 102),
          `rotate(${attack ? 60 : 0} 49 76)`,
        );
    } else {
      body +=
        path(
          "M60 70L97 70 103 112 110 134 49 134 57 107Z",
          kind === "aquiles" ? gold : color,
        ) +
        path(
          "M60 75L63 108 81 111 95 105 97 78",
          "none",
          kind === "aquiles" ? "#ffdc7b" : "#ffffff44",
          3,
        ) +
        rect(54, 109, 47, 8, kind === "medea" ? "#e8bd63" : "#543e3d", 2);
      body += path("M58 77L43 98 50 109", "none", skin, 12);
      if (kind === "medea")
        body +=
          path(
            "M59 114L53 151 77 154 82 120 87 154 107 147 99 114Z",
            "#a74465",
          ) + path("M63 117L60 143M90 120L98 142", "none", "#d77788", 3);
    }
    // Head and expressive face.
    if (kind === "minotauro") {
      body += path(
        "M55 28Q28 40 24 15Q16 45 51 49M100 28Q125 32 128 8Q144 42 108 49",
        "#f2d9ad",
      );
      body +=
        path("M47 27L70 17 110 31 112 65 98 79 61 73 46 55Z", "#8f594d") +
        path("M64 24L70 9 78 20 85 12 94 29", "#483e43") +
        ellipse(101, 62, 24, 16, "#c18d73") +
        ellipse(110, 61, 4, 3, ink) +
        eye(88, 42) +
        path("M77 31L99 35", "none", ink, 5) +
        path("M86 70L94 73 91 66", "#fff3cf", ink, 1);
    } else if (kind === "ciclope") {
      body +=
        ellipse(82, 42, 31, 32, "#b7a47c") +
        path("M52 27L60 12 84 7 107 20 109 31 89 23 66 28Z", "#655148") +
        ellipse(86, 39, 15, 13, "#fffae8") +
        ellipse(90, 39, 6, 8, "#855230") +
        ellipse(92, 39, 3, 5, ink) +
        path("M78 59Q89 65 102 58", "none", ink, 3) +
        path("M77 60L81 68 86 62", "#fff3d7", ink, 1);
    } else {
      body +=
        ellipse(81, 46, 25, 30, kind === "centimano" ? "#91ada2" : skin) +
        ellipse(58, 51, 7, 10, kind === "centimano" ? "#91ada2" : skin) +
        path("M103 45L113 54 102 57", skin) +
        eye(93, 44) +
        path("M86 32L101 35", "none", ink, 3) +
        path("M88 65Q97 68 103 61", "none", ink, 2);
      if (kind === "aquiles")
        body +=
          path("M54 28Q69 5 97 21L107 36 87 31 76 42 75 74 57 68Z", gold) +
          path("M62 21Q42 6 62 2L87 4 106 17 94 24Z", "#294c70") +
          path("M59 33L63 60M62 26L94 25", "none", "#ffdf81", 3);
      if (kind === "perseo")
        body +=
          path("M54 34Q58 9 85 13Q107 14 110 34L76 29 58 43Z", "#5482a2") +
          path("M62 28L39 9 40 26 29 19 36 35 25 31 44 45 60 40Z", "#ebefdf") +
          path("M57 35L38 21", "none", "#98b5c1", 2);
      if (kind === "hercules")
        body +=
          path(
            "M54 55L45 29 53 8 69 14 86 10 107 21 111 43 99 37 92 30 75 29 67 37 65 66Z",
            "#a57940",
          ) +
          ellipse(63, 18, 8, 8, "#c29a50") +
          ellipse(98, 21, 7, 7, "#c29a50") +
          path("M62 24L74 20 88 24 89 30 73 34Z", "#e2b55f") +
          ellipse(85, 27, 6, 4, ink) +
          path("M68 34L69 43 75 35", "#fff5d2", ink, 1) +
          path("M51 53L45 83 56 78 57 100 69 85 69 59Z", "#936f42");
      if (kind === "medea")
        body +=
          path(
            "M55 46Q41 14 73 10Q104 1 109 34L102 54 97 24 71 28 64 60 56 76Z",
            "#e4bf69",
          ) +
          path("M56 33L102 31", "none", "#a54061", 5) +
          path("M85 24L91 32 85 41 79 33Z", "#6acbad", "#2e635f", 2);
      if (kind === "atalanta")
        body +=
          path(
            "M53 49Q41 22 61 18L66 9 93 15 107 24 95 31 73 27 65 49Z",
            "#573c44",
          ) + path("M56 32L95 26", "none", gold, 4);
      if (kind === "centimano")
        body +=
          path("M53 26L59 8 72 16 86 5 96 17 106 13 108 31 87 26Z", "#3f626b") +
          path("M62 55L71 74 100 75 106 57 90 64Z", "#486b78");
      if (kind === "cronos")
        body +=
          path("M53 34L51 11 64 19 72 3 85 19 99 8 103 35Z", gold) +
          path(
            "M59 53L65 75 88 95 105 66 104 53 91 60 80 58 70 48Z",
            "#d0d5cd",
          ) +
          path("M70 66L85 83 97 65", "none", "#f4efdb", 3) +
          ellipse(94, 44, 3, 3, "#8ee8e4", ink, 0);
      if (kind === "miner")
        body +=
          path("M53 34Q52 8 77 10Q104 12 106 35Z", "#c88645") +
          path("M43 36Q79 27 117 38", "none", "#e4b873", 8);
    }
    // Distinct weapons: fists remain bare; Perseus gets a curved sickle, never a sword.
    if (["aquiles", "perseo"].includes(kind)) {
      body += group(
        path("M97 79L119 82", "none", skin, 13) +
          fist(122, 82, 0.7) +
          (kind === "aquiles"
            ? path("M119 75L121 22 129 12 135 24 129 76Z", "#d8e5df") +
              path("M115 76L136 79", "none", gold, 5)
            : path(
                "M124 75L125 43Q111 32 119 18Q130 2 148 16Q153 26 145 38L140 23Q131 16 128 25Q126 31 135 36L132 75Z",
                "#dce8dc",
              )) +
          path("M124 79L123 93", "none", "#7a4e3d", 5),
        `rotate(${attack ? 68 : -8} 100 80)`,
      );
      body +=
        ellipse(48, 99, 25, 30, kind === "perseo" ? "#efd063" : "#b77940") +
        ellipse(48, 99, 19, 24, gold) +
        ellipse(48, 99, 8, 9, "#f8dd8c") +
        path("M48 77V89M48 109V121M30 99H38M58 99H66", "none", "#987039", 3);
    }
    if (kind === "atalanta")
      body +=
        path("M92 76L125 78", "none", skin, 11) +
        group(
          path("M124 35Q153 77 126 123", "none", "#a67b43", 5) +
            path("M125 36L111 77 126 122", "none", "#ede6c9", 1.5) +
            path("M78 80L142 77", "none", "#ddd4ae", 3) +
            path("M139 72L151 77 138 82Z", "#d7e3dc", ink, 1) +
            path("M59 79L81 88 106 78", "none", skin, 11),
          `translate(${attack ? 5 : 0} 0)`,
        );
    if (kind === "medea")
      body +=
        path("M96 80L119 91", "none", skin, 11) +
        group(
          path("M128 143L127 35", "none", "#805442", 6) +
            path("M115 35Q107 18 126 11Q145 21 137 36L127 46Z", gold) +
            path(
              "M127 16Q113 30 126 37Q141 30 127 16Z",
              attack ? "#ffdf78" : "#7ac4af",
            ),
          `rotate(${attack ? 17 : 0} 127 91)`,
        );
    if (kind === "cronos")
      body +=
        path("M101 81L126 80", "none", skin, 15) +
        path(
          "M134 146L133 30Q108 6 109 1Q158 4 152 53L144 36 136 30",
          "none",
          gold,
          6,
        ) +
        ellipse(132, 84, 8, 9, skin);
    if (kind === "miner")
      body +=
        group(
          path("M109 116L116 55", "none", "#86583f", 6) +
            path("M92 61Q116 39 138 60L117 54Z", "#b6c6c5") +
            fist(113, 91, 0.6),
          `rotate(${attack ? -55 : 15} 107 92)`,
        ) +
        path("M37 109L65 110 62 141 42 140Z", "#956f4c") +
        path("M39 113Q48 92 62 112", "none", "#d8c69d", 3) +
        ellipse(48, 113, 6, 4, gold) +
        ellipse(56, 112, 6, 4, "#a7b4b8");
  }
  return svg(body);
}
export function castle(enemy = false) {
  const stone = enemy ? "#656b7c" : "#d7c49c",
    light = enemy ? "#93929a" : "#f1dfb6",
    shade = enemy ? "#484e62" : "#b39a74",
    flag = enemy ? "#c8585c" : "#397c98";
  let b = "";
  b += ellipse(160, 283, 149, 18, "#203d4533", ink, 0);
  for (const x of [20, 224]) {
    b +=
      rect(x, 99, 74, 178, stone, 5) +
      path(
        `M${x} 99L${x - 5} 76H${x + 13}V91H${x + 29}V76H${x + 47}V91H${x + 61}V76H${x + 79}L${x + 74} 99Z`,
        light,
      ) +
      rect(x + 24, 127, 24, 50, shade, 10) +
      path(`M${x + 29} 130V174M${x + 46} 130V174`, "none", light, 3) +
      path(
        `M${x + 3} 197H${x + 69}M${x + 3} 237H${x + 69}M${x + 34} 198V236`,
        "none",
        shade,
        2,
      );
  }
  b +=
    rect(85, 110, 146, 167, stone) +
    path(
      "M79 111L79 95 99 95 99 108 120 108 120 95 142 95 142 108 164 108 164 95 186 95 186 108 210 108 210 95 234 95 234 113Z",
      light,
    ) +
    path("M105 272V196Q105 136 158 136Q212 136 212 196V272Z", shade) +
    path("M116 277V195Q116 149 158 149Q201 149 201 195V277Z", "#243242") +
    path(
      "M105 195H117M199 195H212M109 172L122 178M119 150L132 163M155 136V150M187 147L179 160",
      "none",
      light,
      6,
    );
  b +=
    path("M116 104V50L158 21 201 50V104Z", light) +
    path("M109 51L158 14 208 51Z", shade) +
    path(
      "M126 86H191M130 80V58M149 80V46M168 80V46M188 80V58",
      "none",
      shade,
      5,
    ) +
    path("M47 77V8M261 77V8", "none", ink, 4) +
    path(`M49 11Q69 0 91 12L89 46Q68 34 49 44Z`, flag) +
    path(`M263 11Q282 0 309 12L306 46Q282 34 263 44Z`, flag);
  return svg(b, 330, 300);
}
export function door(stage: number) {
  if (stage === 3)
    return svg(
      path("M4 118L12 87 26 117 41 110 62 123 80 109 86 125Z", "#966a4b") +
        path("M20 118L30 102 36 117M55 116L61 98 71 120", "#d3ad71"),
      90,
      130,
    );
  let b =
    path("M4 128V49Q4 5 45 5Q86 5 86 49V128Z", "#926448") +
    path(
      "M16 125V41M32 126V18M48 126V10M65 126V23M79 127V45",
      "none",
      "#bb8c56",
      3,
    ) +
    rect(5, 58, 80, 10, "#425567", 2) +
    rect(5, 104, 80, 10, "#425567", 2) +
    ellipse(37, 86, 4, 7, gold) +
    ellipse(54, 86, 4, 7, gold);
  if (stage > 0)
    b += path("M39 8L31 35 46 48 34 80 49 94 43 124", "none", "#352f32", 4);
  if (stage > 1)
    b += path(
      "M5 47L27 56 34 80 14 99M84 34L65 54 69 81 49 94",
      "none",
      "#352f32",
      5,
    );
  return svg(b, 90, 130);
}
export function tower(kind: string) {
  let b =
    ellipse(65, 167, 53, 10, "#253e452c", ink, 0) +
    path("M32 159L38 68 94 68 101 159Z", "#c1baa1") +
    path("M73 70L94 70 101 159 74 159Z", "#9c9f92") +
    rect(27, 155, 79, 12, "#e6d9b6", 3) +
    path(
      "M36 114L97 114M36 139H100M62 89V112M62 115V139",
      "none",
      "#8e9288",
      2,
    ) +
    rect(57, 87, 18, 29, "#425668", 8);
  if (kind === "flechas")
    b +=
      path("M25 69V48H40V59H53V48H68V59H81V48H97V59H110V74Z", "#ede0b9") +
      path("M47 44L78 21 96 43", "none", "#765443", 6) +
      path("M47 44H96", "none", "#f5e3b4", 2) +
      path("M57 36L114 24", "none", "#b69b61", 5) +
      path("M109 20L125 21 113 31Z", "#e5eeea");
  if (kind === "fuego")
    b +=
      path("M26 65L36 46H96L107 65Z", "#d39867") +
      path(
        "M38 44Q22 29 44 10Q37 29 61 22Q62 3 80 0Q74 22 91 25Q110 36 90 46Z",
        "#ef8051",
      ) +
      path("M54 44Q43 32 59 25Q58 40 75 18Q94 40 77 45Z", "#ffe09a", ink, 1);
  if (kind === "magia")
    b +=
      path("M27 72L42 51 88 51 107 72Z", "#6d7694") +
      path("M40 51L51 18 64 29 80 12 94 51Z", "#b8b8c0") +
      path("M66 0L82 22 66 49 50 23Z", "#7bd2cd") +
      path("M66 0V49M51 23H81", "none", "#d7fff2", 2) +
      ellipse(66, 59, 12, 4, "#8bdcd0", ink, 1);
  return svg(b, 132, 180);
}
export function landscape(layer = "all") {
  const defs = `<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#83b8c7"/><stop offset="1" stop-color="#f6e4b6"/></linearGradient><linearGradient id="land" x2="0" y2="1"><stop stop-color="#acb788"/><stop offset="1" stop-color="#53796c"/></linearGradient></defs>`;
  let b = defs + `<path fill="url(#sky)" d="M0 0H2400V620H0Z"/>`;
  b +=
    ellipse(1640, 127, 65, 65, "#fff0be88", ink, 0) +
    ellipse(1640, 127, 47, 47, "#fff3cb", ink, 0);
  if (layer === "sky") return svg(b, 2400, 620);
  if (layer !== "all") b = defs;
  b +=
    path(
      "M0 306L140 190 231 274 365 84 563 279 706 204 847 307 1129 122 1344 287 1510 204 1680 308 1927 117 2200 278 2400 139V470H0Z",
      "#91aead",
      "#91aead",
      0,
    ) +
    path(
      "M286 184L365 84 468 185 399 159 367 128 341 171Z",
      "#d9ddd0",
      "#d9ddd0",
      0,
    ) +
    path(
      "M1064 197L1129 122 1220 215 1145 180 1125 161Z",
      "#e4e1cd",
      "#e4e1cd",
      0,
    ) +
    path(
      "M1854 189L1927 117 2020 205 1945 169 1927 147Z",
      "#d4dbcd",
      "#d4dbcd",
      0,
    );
  if (layer === "mountains") return svg(b, 2400, 620);
  if (layer !== "all") b = defs;
  b +=
    path(
      "M0 365Q180 284 382 337T795 335T1241 345T1670 317T2105 345T2400 303V500H0Z",
      "#9fb399",
      "#9fb399",
      0,
    ) +
    path(
      "M0 411Q198 321 452 394T893 389T1360 393T1761 387T2180 386T2400 388V525H0Z",
      "url(#land)",
      "#647f69",
      0,
    );
  for (const x of [600, 1110, 1720]) {
    b += group(
      path("M0 36L81 6 165 36Z", "#d3cead", "#899d8e", 2) +
        rect(7, 114, 150, 12, "#c0bea2") +
        [16, 56, 96, 136]
          .map(
            (p, i) =>
              rect(p, 40, 14, i === 2 ? 48 : 74, "#d1cbae") +
              rect(p - 3, 37, 20, 7, "#e5d9b6"),
          )
          .join(""),
      `translate(${x} ${x === 1110 ? 259 : 286}) scale(.8)`,
    );
  }
  if (layer === "hills") return svg(b, 2400, 620);
  if (layer !== "all") b = defs;
  b +=
    path(
      "M0 459Q200 449 400 460T800 459T1200 460T1600 459T2000 460T2400 459V620H0Z",
      "#d0bb87",
      "#778965",
      4,
    ) +
    path(
      "M0 497Q240 478 540 491T1000 493T1450 491T1900 496T2400 491V620H0Z",
      "#b79e70",
      "#b79e70",
      0,
    );
  for (let i = 0; i < 130; i++) {
    let x = (i * 197) % 2400,
      y = 518 + ((i * 31) % 99);
    b += path(
      `M${x} ${y}l${6 + (i % 12)} -2`,
      "none",
      i % 3 ? "#9f8a6544" : "#e1cca0",
      2,
    );
  }
  for (const x of [30, 990, 1510, 2340]) {
    b += group(
      path("M0 95Q-5 47 6 18", "none", "#6a7054", 7) +
        ellipse(-10, 29, 30, 22, "#667e60", "#667e60", 0) +
        ellipse(19, 17, 30, 24, "#7d9168", "#7d9168", 0) +
        ellipse(33, 39, 28, 16, "#728762", "#728762", 0),
      `translate(${x} 369)`,
    );
  }
  return svg(b, 2400, 620);
}
export function mine() {
  return svg(
    path("M5 112L32 58 46 62 78 11 104 39 123 37 157 111Z", "#7d9190") +
      path(
        "M78 11L73 64 32 58M73 64L102 87 104 39M73 64L63 110M123 37L116 81 157 111",
        "none",
        "#afbbb0",
        4,
      ) +
      path("M42 79L53 67 67 74 62 88 48 92Z", gold) +
      path("M92 93L100 80 114 85 112 101Z", "#efd168") +
      path("M99 51L106 44 114 54 108 64Z", "#f2d487") +
      ellipse(23, 113, 18, 7, "#99a59a") +
      ellipse(142, 113, 17, 8, "#b9beb0"),
    170,
    130,
  );
}
export function mapArt() {
  let b = `<defs><radialGradient id="sea"><stop stop-color="#547f88"/><stop offset="1" stop-color="#203f53"/></radialGradient></defs><path fill="url(#sea)" d="M0 0H1400V800H0Z"/>`;
  for (let i = 0; i < 35; i++)
    b += path(
      `M${(i * 179) % 1400} ${80 + i * 20}q20 -8 40 0t40 0`,
      "none",
      "#a9c6bd18",
      2,
    );
  const land =
    "M155 283L199 190 303 168 381 110 502 149 546 220 646 190 721 218 805 183 870 231 968 219 1034 279 1207 307 1252 391 1209 454 1258 520 1159 583 1081 582 1027 677 932 635 873 689 783 627 715 655 650 602 575 639 515 551 438 563 397 489 272 465 235 407 162 395Z";
  b +=
    group(path(land, "#112f4033", "#112f4033", 18), "translate(0 17)") +
    path(land, "#b9c2a1", "#739995", 15) +
    path(land, "#c5c8a3", "#e2d6ad", 4);
  b +=
    path("M212 334Q393 212 543 334T865 366T1174 377", "none", "#94ac90", 76) +
    path("M388 473Q533 446 653 522T996 535", "none", "#a8b493", 64) +
    path(
      "M729 224Q659 315 754 365T855 452Q891 515 963 578",
      "none",
      "#759da0",
      11,
    );
  for (const [x, y, s] of [
    [335, 240, 1],
    [424, 221, 0.75],
    [913, 287, 1.1],
    [1040, 454, 0.8],
    [581, 481, 0.7],
  ])
    b += group(
      path("M-57 39L0 -49 56 39Z", "#8b9e89", "#738b7e", 2) +
        path(
          "M-24 -11L0 -49 25 -9 7 -17-2 -28-10 -13Z",
          "#e6dfbd",
          "#e6dfbd",
          0,
        ),
      `translate(${x} ${y}) scale(${s})`,
    );
  b += path(
    "M380 379Q490 354 593 406T795 407T1015 382",
    "none",
    "#8c7f5d",
    5,
  ).replace("/>", ' stroke-dasharray="4 15"/>');
  for (let i = 0; i < 24; i++) {
    const x = 260 + ((i * 137) % 900),
      y = 290 + ((i * 47) % 230);
    b += path(`M${x} ${y}l-10 18h20Z`, "#69866c", "#69866c", 1);
  }
  b += group(
    path(
      "M0 -44L10 -10 44 0 10 10 0 44-10 10-44 0-10 -10Z",
      "#d5caa0",
      "#d5caa0",
      2,
    ) +
      path("M0 -44V44M-44 0H44", "none", "#355363", 2) +
      ellipse(0, 0, 5, 5, "#355363"),
    "translate(1250 140)",
  );
  return svg(b, 1400, 800);
}
export function icon(name: string) {
  let b = "";
  if (name === "shelter")
    b = path(
      "M5 28V10H10V15H16V6H22V15H28V10H33V28H23V21H15V28Z",
      "currentColor",
      "currentColor",
      1,
    );
  else if (name === "defend")
    b =
      path(
        "M6 6L19 2 32 6V17Q29 28 19 33Q8 28 6 17Z",
        "none",
        "currentColor",
        3,
      ) + path("M19 7V26", "none", "currentColor", 2);
  else if (name === "attack" || name === "encounter")
    b =
      path("M7 3L28 24 24 28 3 7Z", "currentColor", "currentColor", 1) +
      path("M31 3L10 24 14 28 35 7Z", "currentColor", "currentColor", 1) +
      path(
        "M21 29L30 20M8 20L17 29M28 28L33 33M10 28L5 33",
        "none",
        "currentColor",
        3,
      );
  else if (name === "gold")
    b =
      ellipse(19, 18, 12, 12, "#e7b951", "#916c30", 2) +
      ellipse(19, 18, 7, 7, "none", "#fff0a1", 2);
  else
    b =
      path("M4 25L10 10 25 5 34 20 27 30 12 32Z", "#adb9ba", "#647c86", 2) +
      path("M10 10L20 19 34 20M20 19L12 32", "none", "#e3e7db", 2);
  return svg(b, 38, 36);
}
