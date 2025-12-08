/**
 * Crea un dibujo de estrellas descendente basado en un número máximo.
 * @param {number} max - El número de estrellas inicial.
 * @returns {string} - La cadena de texto con el dibujo (HTML).
 */
function dibujo(max) {
    let resultado = ""; // Inicializamos la variable vacía

    // Usamos un bucle FOR para no tener que escribir mil 'if/else'
    // Empezamos en el número máximo (ej: 5) y bajamos hasta 1
    for (let i = max; i > 0; i--) {
        // .repeat(i) repite el asterisco 'i' veces
        // <br> hace el salto de línea para que parezca un dibujo
        resultado += "*".repeat(i) + "<br>"; 
    }

    return resultado; // Devolvemos el string construido
}

// EJECUCIÓN
const numeroElegido = 5;
const dibujoFinal = dibujo(numeroElegido);

// Corrección del DOM:
// 1. "resultado" aquí debe ser el ID de un elemento HTML real (entre comillas).
// 2. Usamos la variable que guardó el retorno de la función.
// 3. Usamos template literals (las comillas invertidas ` `) para mezclar texto y variables.
const elementoHTML = document.getElementById("tuContenedor"); 

if (elementoHTML) {
   elementoHTML.innerHTML = `${dibujoFinal} <br> (Este es el dibujito pedido según el número ${numeroElegido})`;
} else {
   console.log("No se encontró el elemento HTML para mostrar el resultado");
}