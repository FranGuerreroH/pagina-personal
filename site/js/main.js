const elementoAnio = document.querySelector("[data-year]");
const botonVolverArriba = document.querySelector("[data-back-to-top]");

if (elementoAnio) {
  elementoAnio.textContent = String(new Date().getFullYear());
}

if (botonVolverArriba) {
  botonVolverArriba.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
