import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Publication = {
  branch: string;
  commit: string;
  publishedAt: string;
  files: string[];
};
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

export function branchPath(branch: string) {
  const parts = branch.split("/");
  if (
    parts.some(
      (p) =>
        !p ||
        p === "." ||
        p === ".." ||
        p.startsWith(".") ||
        /[\\\x00-\x20\x7f]/.test(p),
    ) ||
    branch === "gh-pages"
  )
    throw new Error("Nombre de rama no válido para publicar");
  return parts.map(encodeURIComponent).join("/");
}

async function filesIn(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(path.join(root, prefix), {
    withFileTypes: true,
  });
  const files: string[] = [];
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...(await filesIn(root, relative)));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Recurso no regular: ${relative}`);
  }
  return files;
}

/** Merge only this branch's files; keep every other branch, including nested names. */
export async function mergePublication(
  site: string,
  dist: string,
  branch: string,
  commit: string,
) {
  branchPath(branch);
  const target = path.join(site, branch),
    metadata = path.join(site, ".deployments");
  const manifest = path.join(
    metadata,
    `${Buffer.from(branch).toString("base64url")}.json`,
  );
  await mkdir(metadata, { recursive: true });
  let previous: Publication | undefined;
  try {
    previous = JSON.parse(await readFile(manifest, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (previous)
    for (const file of previous.files) {
      const resolved = path.resolve(target, file);
      if (!resolved.startsWith(path.resolve(target) + path.sep))
        throw new Error("Ruta no válida en el manifiesto anterior");
      await rm(resolved, { force: true });
    }
  const files = await filesIn(dist);
  await mkdir(target, { recursive: true });
  await cp(dist, target, { recursive: true });
  const publication: Publication = {
    branch,
    commit,
    publishedAt: new Date().toISOString(),
    files: [...files, "version.json"],
  };
  await writeFile(
    path.join(target, "version.json"),
    JSON.stringify(
      { branch, commit, publishedAt: publication.publishedAt },
      null,
      2,
    ),
  );
  await writeFile(manifest, JSON.stringify(publication, null, 2));
  const publications: Publication[] = await Promise.all(
    (await readdir(metadata))
      .filter((f) => f.endsWith(".json"))
      .map(async (f) =>
        JSON.parse(await readFile(path.join(metadata, f), "utf8")),
      ),
  );
  publications.sort(
    (a, b) =>
      (a.branch === "master" ? -2 : a.branch === "dev" ? -1 : 0) -
        (b.branch === "master" ? -2 : b.branch === "dev" ? -1 : 0) ||
      a.branch.localeCompare(b.branch),
  );
  await writeFile(path.join(site, ".nojekyll"), "");
  await writeFile(
    path.join(site, "index.html"),
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Guerra de Dioses · Versiones</title><style>body{font:18px system-ui;background:#193b4a;color:#f4e9cd;max-width:760px;margin:10vh auto;padding:24px}h1{font:48px Georgia;color:#edc777}a{color:#edc777}li{padding:18px 0;border-bottom:1px solid #ffffff22}small{display:block;color:#b7cbbf;margin-top:8px}code{font-size:13px}footer{margin-top:35px;color:#b7cbbf}</style></head><body><h1>Guerra de Dioses</h1><p>El asedio del Olimpo · El juego de David</p><ul>${publications.map((p) => `<li><a href="./${branchPath(p.branch)}/">${p.branch === "master" ? "Jugar · última release" : p.branch === "dev" ? "Jugar · desarrollo" : escape(p.branch)}</a><small>Rama <strong>${escape(p.branch)}</strong> · <code>${escape(p.commit.slice(0, 7))}</code> · ${escape(p.publishedAt.slice(0, 10))}</small></li>`).join("")}</ul><footer>Cada rama conserva su propia versión. <strong>master</strong>: releases · <strong>dev</strong>: desarrollo.</footer></body></html>`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [site, dist, branch, commit] = process.argv.slice(2);
  if (!site || !dist || !branch || !commit)
    throw new Error("Uso: tsx scripts/pages.ts <site> <dist> <rama> <commit>");
  await mergePublication(site, dist, branch, commit);
}
