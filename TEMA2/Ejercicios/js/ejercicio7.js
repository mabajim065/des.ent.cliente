

// constantes que suman , restan , multuiplica y divide  dos numeeros
const sumar = (a, b) => a + b;
const restar = (a, b) => a - b;
const multiplicar = (a, b) => a * b;
const dividir = (a, b) => {
  // como no se puede dividir entre 0 mostramos un error
  if (b === 0) {
    return "No se puede dividir entre 0!!";
  }
  return a / b;
};

// obtenemos los unmero de los inputs y mostramos el resultado.
const calcular = (operacion) => {
  // Cojo los valores de los inputs
  //el getelementbyid me sirve para obtener el valor de un input por su id
  const num1 = parseFloat(document.getElementById("num1").value);
  const num2 = parseFloat(document.getElementById("num2").value);
  const resultado = document.getElementById("resultado");

  // hay que conprobar que los dos input no halla ninguno vacio
  if (isNaN(num1) || isNaN(num2)) {
    resultado.textContent = "Por favor, introduce dos números válidos.";
    return;
  }

  // dependiendo de lo que quiera hacer el usuario llamo a una funcion o a otra 
  let res;
  switch (operacion) {
    case "sumar":
      res = sumar(num1, num2);
      break;
    case "restar":
      res = restar(num1, num2);
      break;
    case "multiplicar":
      res = multiplicar(num1, num2);
      break;
    case "dividir":
      res = dividir(num1, num2);
      break;
  }

  // Muestro el resultado final en el HTML
  resultado.textContent = `Resultado: ${res}`;
};

// pongo  los botones  enlazadons a cada operacion
document.getElementById("sumar").addEventListener("click", () => calcular("sumar"));
document.getElementById("restar").addEventListener("click", () => calcular("restar"));
document.getElementById("multiplicar").addEventListener("click", () => calcular("multiplicar"));
document.getElementById("dividir").addEventListener("click", () => calcular("dividir"));
