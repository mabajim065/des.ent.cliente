
// primero creamos un numero aleatorio entre el 1 y el 10
const numeroAleatorio = Math.floor(Math.random() * 10) + 1;

// le vamos a pedir al usuario que introduzca un numero
// uso el parse para que le deje escribir
const numUsuario = parseInt(prompt("Adivina que numero estoy pensando :)  : "));


// ahora tenemos que mirar si el numero que han metido es el mismo que el aleatrorio
if (numeroAleatorio === numUsuario) {
    resultado.textContent = " Ole, acertaste!!";
} else {
    resultado.textContent = " Oh, lo sineto ,pero ese no es el numero";
}
