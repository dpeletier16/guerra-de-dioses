import { mkdir, writeFile } from "node:fs/promises";
import {
  character,
  castle,
  door,
  tower,
  landscape,
  mine,
  mapArt,
  icon,
  svg,
} from "../src/art";
import { UNITS, TOWERS } from "../src/config";
await mkdir("public/art", { recursive: true });
const art: Record<string, string> = {
  landscape: landscape(),
  map: mapArt(),
  mine: mine(),
  "castle-home": castle(),
  "castle-enemy": castle(true),
};
for (const layer of ["sky", "mountains", "hills", "ground"])
  art[`landscape-${layer}`] = landscape(layer);
art.roster = svg(
  `<rect width="1100" height="560" fill="#e9debe"/>` +
    Object.entries(UNITS)
      .map(
        ([kind, s], i) =>
          `<g transform="translate(${25 + (i % 5) * 215} ${25 + Math.floor(i / 5) * 270})">${character(kind)}<text x="80" y="200" text-anchor="middle" font-family="sans-serif" font-size="19" fill="#294758">${s.name}</text></g>`,
      )
      .join(""),
  1100,
  560,
);
for (const kind of [...Object.keys(UNITS), "miner"])
  for (let i = 0; i < 6; i++) art[`${kind}-${i}`] = character(kind, i);
for (const kind of Object.keys(TOWERS)) art[`tower-${kind}`] = tower(kind);
for (let i = 0; i < 4; i++) art[`door-${i}`] = door(i);
for (const key of ["shelter", "defend", "attack", "encounter", "gold", "stone"])
  art[`icon-${key}`] = icon(key);
await Promise.all(
  Object.entries(art).map(([key, body]) =>
    writeFile(`public/art/${key}.svg`, body),
  ),
);
console.log(
  `Exportadas ${Object.keys(art).length} ilustraciones SVG originales.`,
);
