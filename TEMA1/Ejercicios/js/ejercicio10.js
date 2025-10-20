// primeor cogemos la fecha actual 
const diahoy = new Date();

// luego cogemos cunaod el la fecha de navidad
let navidad = new Date(diahoy.getFullYear(), 11, 25); // esto tinee que estar 

//vamos  a ver si navidad a pasado ya  todavuia no
if (diahoy > navidad) {
    navidad.setFullYear(navidad.getFullYear() + 1);
}

const quedan = (navidad - diahoy) / 1000 / 60 / 60 / 24;


resultado.textContent = " quedan " + quedan + " dias para navodad";