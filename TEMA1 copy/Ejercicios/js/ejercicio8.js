/*************************************************************************************************
 * 3.Almacenar en un Map los nombres de ciudades como clave y la cantidad de habitantes como
valores. Mostrar simplemente la lista con un map.
 *************************************************************************************************/
// 1. creamos un json con las ciudades y sus habitantes

let ciudades = [{
    "nombre": "sevilla",
    "habitantes": 700000
},
{
    "nombre": "cadiz",
    "habitantes": 7777777
},
{
    "nombre": "madrid",
    "habitantes": 453546
},
{
    "nombre": "magala",
    "habitantes": 2222
}];
// yo creo primero un mapa vacio y ya pues luego recorro el array para verlo
let ciudadesmapa = new Map();

//ahora lo recorremos entero 
ciudades.forEach(ciudad => { //uso el forecah para recorerlo
    ciudadesmapa.set(ciudad.nombre, ciudad.habitantes)
});

//y ya por ultimo lo muestro por pantalla
// pero esto lo estoy mostrabdo del tiron y yo quiero mostrarlo estilo lista uno `por uno
console.log(ciudadesmapa);

// muestro cada uno su nombre y ciudada
/**
 * aver para que se me puestre estilo lista yo he tenido antes que llamar a la 
 * ciudades de arriba para que se mee muestre pq sino solo me me esta mostrando estilo horroroso.
 */
ciudadesmapa.forEach((habitantes, nombre) => {
    console.log(`${nombre} tiene ${habitantes} habitantes`);
});