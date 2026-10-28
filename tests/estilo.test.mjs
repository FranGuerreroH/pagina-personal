import assert from "node:assert/strict";
import test from "node:test";
import { PERFIL } from "./perfil.mjs";
import { leerArchivoSite } from "./utilidades.mjs";

const estilos = leerArchivoSite("css/estilos.css");
const raiz = estilos.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
const fueraDeRaiz = estilos.replace(/:root\s*\{[^}]*\}/g, "");

test("la raíz define los colores exactos del perfil y no filtra valores de paleta", () => {
  for (const [variable, valor] of Object.entries(PERFIL.paleta)) {
    const declaracion = raiz.match(new RegExp(`${variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+);`));
    assert.ok(declaracion, `Falta la variable ${variable} en :root.`);
    assert.equal(declaracion[1].trim(), valor, `${variable} debe tener el valor ${valor}.`);
    assert.ok(!fueraDeRaiz.includes(valor), `El color ${valor} debe usarse mediante var() fuera de :root.`);
  }

  assert.match(estilos, /var\(--color-primario\)/, "Falta el uso de var(--color-primario).");
});

test("la hoja de estilos usa las fuentes y preferencias del perfil", () => {
  assert.ok(estilos.includes(PERFIL.fuenteTitulos), `Falta la fuente de títulos ${PERFIL.fuenteTitulos}.`);
  assert.ok(estilos.includes(PERFIL.fuenteTexto), `Falta la fuente de texto ${PERFIL.fuenteTexto}.`);
  assert.ok(
    estilos.includes(`@media (max-width: ${PERFIL.puntoRuptura})`),
    `Falta el punto de ruptura ${PERFIL.puntoRuptura}.`
  );

  if (PERFIL.modoOscuro) {
    assert.match(estilos, /prefers-color-scheme:\s*dark/, "Falta el modo oscuro según las preferencias del sistema.");
  }
});
