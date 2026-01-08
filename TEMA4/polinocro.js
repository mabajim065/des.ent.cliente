/**
 * Función recursiva para verificar si una palabra es palíndromo
 */
function esPalindromo(palabra) {
  // 1. Limpieza básica: convertimos a minúsculas y quitamos espacios
  // (Esto hace que el ejercicio funcione con frases reales)
  let texto = palabra.toLowerCase().replace(/\s/g, "");

  // 2. Función interna que realiza la recursividad
  function verificar(str) {
    // Caso base: si queda 0 o 1 carácter, es palíndromo
    if (str.length <= 1) {
      return true;
    }

    // Comparamos el primer carácter con el último
    if (str[0] !== str[str.length - 1]) {
      return false;
    }

    // Llamada recursiva: cortamos los extremos y volvemos a evaluar
    return verificar(str.slice(1, -1));
  }

  return verificar(texto);
}

// --- EJEMPLOS DE PRUEBA ---

const pruebas = [
  "radar",
  "reconocer",
  "hola",
  "marialamejor",
  "JavaScript"
];

pruebas.forEach(item => {
  console.log(`¿Es "${item}" un palíndromo? -> ${esPalindromo(item)}`);
});