import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { branchPath, mergePublication } from "../scripts/pages";
const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map((p) => rm(p, { recursive: true, force: true })),
  );
});
it("publica dev/master y conserva otras ramas y ramas anidadas al actualizar", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "david-pages-"));
  temporary.push(root);
  const site = path.join(root, "site"),
    dist = path.join(root, "dist");
  await mkdir(dist);
  await writeFile(path.join(dist, "index.html"), "first");
  await writeFile(path.join(dist, "old.js"), "old");
  for (const branch of ["dev", "master", "dev/torres"])
    await mergePublication(site, dist, branch, "abcdef1");
  await rm(path.join(dist, "old.js"));
  await writeFile(path.join(dist, "index.html"), "second");
  await mergePublication(site, dist, "dev", "abcdef2");
  expect(await readFile(path.join(site, "dev/index.html"), "utf8")).toBe(
    "second",
  );
  expect(await readFile(path.join(site, "master/index.html"), "utf8")).toBe(
    "first",
  );
  expect(await readFile(path.join(site, "dev/torres/index.html"), "utf8")).toBe(
    "first",
  );
  await expect(readFile(path.join(site, "dev/old.js"))).rejects.toMatchObject({
    code: "ENOENT",
  });
  expect(
    JSON.parse(await readFile(path.join(site, "dev/version.json"), "utf8"))
      .commit,
  ).toBe("abcdef2");
  const index = await readFile(path.join(site, "index.html"), "utf8");
  expect(index).toContain("./master/");
  expect(index).toContain("./dev/torres/");
});
it("codifica rutas públicas y rechaza rutas fuera del sitio o la rama de artefactos", () => {
  expect(branchPath("feature/torres")).toBe("feature/torres");
  expect(branchPath("mejora-áudio")).toBe("mejora-%C3%A1udio");
  for (const branch of ["../escape", "a/../../b", "gh-pages", "/dev", "a\\b"])
    expect(() => branchPath(branch)).toThrow();
});
