/*****************************
 * EJEMPLO FUNCIONES  FLECHA
 *****************************/


/************
 * NOMBRES
 ************/
// creamos un array con los nombres
let nombres = ['Pedro', 'Juan', 'Elena'];
//mostramos el array del nombres
console.log(nombres);
//mostramos el array de los dias
console.log(nombres.map(nom => nom.length));
// Muestra el array con los valores [5, 4, 5]
let sumaNombres = nombres.reduce((acumulador, elemento) => {
    return acumulador + elemento.length;
}, 0);
// Muestra la suma de la longitud de los nombre
console.log(sumaNombres);

/*********
 * DIAS
 *********/
//vamos a crear otro array con los dias de la semana
let dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
// mostramos en el html
document.getElementById('dias').innerHTML = dias.join(', ');
// hacemos lo mismo pero con los dias
console.log(dias);
console.log(dias.map(dia => dia.length));
// Muestra el array con los valores  de cuanto mide cada dia 
let sumaDias = dias.reduce((acumulador, elemento) => {
    return acumulador + elemento.length;
}, 0);
// Muestra la suma de la longitud de los dias
console.log(sumaDias);

docu
