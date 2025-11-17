/**
 * creaos una constante que va a coger el numero maximo q nosotros pongamos 
 * y va a devolver el dibujo de los *
 * @param {*} max 
 * @returns 
 */
function dibujo(numero) {
    if (numero == 1) {
        resultado = "*";
    } else if (numero == 2) {
        resultado = "**" + "*";
    } else if (numero == 3) {
        resultado = "***" + "**";
    } else if (numero == 4) {
        resultado = "****" + "***" + "*";
    } else if (numero == 5) {
        resultado = "*****" + "****" + "***" + "**" + "*";
    }
}

document.getElementById(resultado).innerHTML = " (resultado) + es el dibujito pedido según el numero."