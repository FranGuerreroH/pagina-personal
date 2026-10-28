import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const directorioTests = dirname(fileURLToPath(import.meta.url));
const directorioProyecto = resolve(directorioTests, "..");

export function leerArchivoSite(ruta) {
  return readFileSync(resolve(directorioProyecto, "site", ruta), "utf8");
}

export function extraerAtributos(etiqueta) {
  const atributos = {};
  const contenido = etiqueta.replace(/^<[^\s>]+|\/?>$/g, "");
  const expresion = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let coincidencia;

  while ((coincidencia = expresion.exec(contenido)) !== null) {
    const [, nombre, dobleComilla, comillaSimple, sinComillas] = coincidencia;
    atributos[nombre.toLowerCase()] = dobleComilla ?? comillaSimple ?? sinComillas ?? "";
  }

  return atributos;
}

export function existeFicheroEnlaceRelativo(origen, enlace) {
  const destino = new URL(enlace, `https://sitio.local/${origen}`);
  if (destino.origin !== "https://sitio.local") {
    return true;
  }

  const ruta = decodeURIComponent(destino.pathname).replace(/^\/+/, "");
  return existsSync(resolve(directorioProyecto, "site", ruta || origen || "."));
}
