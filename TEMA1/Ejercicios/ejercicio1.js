//js del ejercicio1.html (Solicitar un dato por pantalla en una ventana emergente y mostrarlo como contenido de un párrafo <p>.)
function solicitarDato() {
    var dato = prompt("Por favor, introduce un dato:");
    document.getElementById("resultado").innerText = dato;
}