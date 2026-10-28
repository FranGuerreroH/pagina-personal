import assert from "node:assert/strict";
import test from "node:test";
import { PERFIL } from "./perfil.mjs";
import { existeFicheroEnlaceRelativo, extraerAtributos, leerArchivoSite } from "./utilidades.mjs";

const paginas = ["index.html", "proyectos.html"];

function extraerEtiquetas(html, nombre) {
  return [...html.matchAll(new RegExp(`<${nombre}\\b[^>]*>`, "gi"))].map(([etiqueta]) => etiqueta);
}

function extraerContenidoSeccion(html, id) {
  const coincidencia = html.match(new RegExp(`<section\\b(?=[^>]*\\bid="${id}")[^>]*>([\\s\\S]*?)<\\/section>`, "i"));
  return coincidencia?.[1] ?? "";
}

test("cada página contiene la estructura, metadatos y enlaces válidos", () => {
  for (const pagina of paginas) {
    const html = leerArchivoSite(pagina);
    const htmlAttrs = extraerAtributos(extraerEtiquetas(html, "html")[0] ?? "");
    const metaViewport = extraerEtiquetas(html, "meta")
      .map(extraerAtributos)
      .find((attrs) => attrs.name === "viewport");
    const metaDescription = extraerEtiquetas(html, "meta")
      .map(extraerAtributos)
      .find((attrs) => attrs.name === "description");
    const encabezadosPrincipales = extraerEtiquetas(html, "h1");
    const textoH1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
      ?.replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      ?? "";

    assert.equal(htmlAttrs.lang, "es", `${pagina}: falta lang="es".`);
    assert.ok(metaViewport, `${pagina}: falta la metaetiqueta viewport.`);
    assert.ok(
      (metaDescription?.content?.length ?? 0) > 20,
      `${pagina}: falta una meta description de más de 20 caracteres.`
    );
    assert.equal(encabezadosPrincipales.length, 1, `${pagina}: debe existir un único h1.`);
    assert.ok(textoH1.includes(PERFIL.nombre), `${pagina}: el h1 no contiene el nombre esperado.`);
    assert.ok(textoH1.includes(PERFIL.titular), `${pagina}: el h1 no contiene el titular esperado.`);

    for (const etiqueta of ["header", "nav", "main", "footer"]) {
      assert.ok(extraerEtiquetas(html, etiqueta).length > 0, `${pagina}: falta el elemento ${etiqueta}.`);
    }

    for (const imagen of extraerEtiquetas(html, "img")) {
      const atributos = extraerAtributos(imagen);
      assert.ok((atributos.alt?.trim().length ?? 0) >= 3, `${pagina}: una imagen necesita un alt de 3 o más caracteres.`);
    }

    for (const nombreAtributo of ["href", "src"]) {
      for (const etiqueta of [...extraerEtiquetas(html, "a"), ...extraerEtiquetas(html, "link"), ...extraerEtiquetas(html, "script"), ...extraerEtiquetas(html, "img")]) {
        const valor = extraerAtributos(etiqueta)[nombreAtributo];
        if (valor) {
          assert.ok(!valor.startsWith("/"), `${pagina}: la ruta ${valor} no puede empezar por "/".`);
          if (!/^(?:[a-z][a-z\d+.-]*:|#)/i.test(valor)) {
            assert.ok(existeFicheroEnlaceRelativo(pagina, valor), `${pagina}: no existe el destino relativo ${valor}.`);
          }
        }
      }
    }
  }
});

test("index.html incluye título, secciones, habilidades y contacto del perfil", () => {
  const html = leerArchivoSite("index.html");
  const titulo = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();

  assert.equal(titulo, PERFIL.titulo, "index.html debe tener el título personal esperado.");

  for (const seccion of PERFIL.secciones) {
    const contenido = extraerContenidoSeccion(html, seccion);
    assert.ok(contenido, `Falta la sección #${seccion}.`);
    assert.ok(/<h2\b/i.test(contenido), `La sección #${seccion} necesita un h2.`);
  }

  const habilidades = extraerContenidoSeccion(html, "habilidades");
  assert.ok(
    extraerEtiquetas(habilidades, "li").length >= PERFIL.minimoHabilidades,
    `#habilidades necesita al menos ${PERFIL.minimoHabilidades} elementos li.`
  );

  const contacto = extraerContenidoSeccion(html, "contacto");
  assert.ok(contacto.includes(`mailto:${PERFIL.email}`), "#contacto debe incluir el correo esperado.");
  assert.ok(contacto.includes(`https://github.com/${PERFIL.usuarioGithub}`), "#contacto debe incluir el perfil de GitHub.");
});

test("proyectos.html presenta proyectos completos y enlaces externos seguros", () => {
  const html = leerArchivoSite("proyectos.html");
  const articulos = [...html.matchAll(/<article\b[^>]*class="[^"]*\bproyecto\b[^"]*"[^>]*>([\s\S]*?)<\/article>/gi)];

  assert.ok(articulos.length >= PERFIL.minimoProyectos, `Se necesitan al menos ${PERFIL.minimoProyectos} artículos de proyecto.`);

  for (const [, contenido] of articulos) {
    assert.ok(/<h[23]\b/i.test(contenido), "Cada proyecto necesita un h2 o h3.");
    assert.ok(/<p\b/i.test(contenido), "Cada proyecto necesita una descripción en un párrafo.");
    assert.ok(/<ul\b[^>]*class="[^"]*\btecnologias\b[^"]*"/i.test(contenido), "Cada proyecto necesita una lista .tecnologias.");
  }

  for (const etiqueta of extraerEtiquetas(html, "a")) {
    const atributos = extraerAtributos(etiqueta);
    if (/^https?:/i.test(atributos.href ?? "")) {
      assert.equal(atributos.target, "_blank", "Los enlaces externos deben abrirse en una pestaña nueva.");
      assert.match(atributos.rel ?? "", /(?:^|\s)noopener(?:\s|$)/, "Los enlaces externos deben incluir rel=noopener.");
    }
  }
});
