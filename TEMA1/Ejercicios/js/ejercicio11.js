//lo primero que teneomos que hacer es hacer las cuentas de celsius  y de fahrenheit
function cAf(celsius) {
    return (celsius * 9 / 5) + 32;
}

function fAc(fahrenheit) {
    return (fahrenheit - 32) * 5 / 9;
}

// ahora ponemos para que el usuario meta la temperatura que el quiera
let temperatura = parseFloat(prompt("introduce la temperatura que quieras: "));

// AHORA TENEMOS QUE PREGUNTAR SI LA HA METIO EN C O EN F 
let tipo = prompt("si esta en celsius pon 'C' y si esta en fahrenheit pon 'F'");

// ponemo lo que nos halla dicho

if (tipo === "C") {
    resultado = cAf(temperatura);
    document.getElementById("resultado").innerHTML = temperatura + " °C es " + resultado + " °F.";
} else if (tipo === "F") {
    resultado = fAc(temperatura);
    document.getElementById("resultado").innerHTML = temperatura + " °F es " + resultado + " °C.";
} else {
    document.getElementById("resultado").innerHTML = "La letra que has metido no corresponde a nada.";
}