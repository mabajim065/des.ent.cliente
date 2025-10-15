/**
 * creaos una constante que va a coger el numero maximo q nosotros pongamos 
 * y va a devolver un numero aleatorio entre 1 y el numero maximo
 * @param {*} max 
 * @returns 
 */
const numeroAleatorio = (max)  => Math.floor(Math.random() * max) + 1;

// conecto conel boton del html con la funcion de crear numero aleatorio
document.getElementById("Crear").addEventListener("click", () => {
  
  // Guardo el numero q se ha metido en el input 
  const num = parseInt(document.getElementById("numero").value);
  
  // concesto el resultado del html con la variable resultado pa que me muestre el resultado
  const resultado = document.getElementById("resultado");

  //ahora si el num que mete el usuario es mayor que 1 muestro un numero aleatorio
  if (!isNaN(num) && num > 1) {
    resultado.textContent = `Número aleatorio entre 1 y ${num}: ${numeroAleatorio(num)}`;
  } else {
    // y en caso de que sea menor que uno no es valido entonces mostramos un  mesnsaje de eroor 
    resultado.textContent = "ese numero no es valido , introduce otro numero mayor que 1";
  }
});