import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const directorioProyecto = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ficherosEsperados = [
  "site/index.html",
  "site/proyectos.html",
  "site/css/estilos.css",
  "site/js/main.js",
  "site/img/avatar.svg",
  "tests/perfil.mjs",
  "tests/utilidades.mjs",
  "tests/estructura.test.mjs",
  "tests/contenido.test.mjs",
  "tests/estilo.test.mjs",
  ".github/workflows/pages.yml",
  ".gitignore",
  ".htmlvalidate.json",
  "package.json",
  "README.md"
];

test("existen todos los ficheros requeridos", () => {
  for (const fichero of ficherosEsperados) {
    assert.ok(
      existsSync(resolve(directorioProyecto, fichero)),
      `Falta el fichero requerido: ${fichero}.`
    );
  }
});

test(".gitignore excluye las dependencias instaladas", () => {
  const gitignore = readFileSync(resolve(directorioProyecto, ".gitignore"), "utf8").replace(/\r\n/g, "\n");
  assert.match(gitignore, /(?:^|\n)node_modules\/(?:\n|$)/, "Falta node_modules/ en .gitignore.");
});
