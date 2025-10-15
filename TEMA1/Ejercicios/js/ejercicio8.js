

/**
 * 1) Creamos el Map inicial con algunas ciudades de ejemplo.
 */
const ciudades = new Map([
  ["Madrid", 3223000],
  ["Cadiz", 794000],
  ["Sevilla", 688711],
]);
/**
 * 2)conectamos con los elementos del HTML que vamos a usar
 */
const listaCiudadesDiv = document.getElementById("listaCiudades");
const infoAccion = document.getElementById("infoAccion");

const inputCiudad = document.getElementById("nuevaCiudad");
const inputHabitantes = document.getElementById("nuevaPoblacion");
const btnAñadir = document.getElementById("btnAñadir");

const btnMostrar = document.getElementById("btnMostrar");
const btnContar = document.getElementById("btnContar");
const btnMas = document.getElementById("btnMas");
const btnMenos = document.getElementById("btnMenos");
const btnLimpiarResaltados = document.getElementById("btnLimpiarResaltados");

/**
 * vamos a hacer una funcion que modifique el map
 * llamaremos a esta funcion para que el html se actualice
 * @returns 
 */
function editarLista() {
    // Limpio la zona donde muestro las ciudades
    listaCiudadesDiv.innerHTML = "";

    // Si no hay ciudades, muestro un mensaje amigable
    if (ciudades.size === 0) {
        listaCiudadesDiv.textContent = "No hay ciudades en el Map. Añade alguna.";
        return;
    }

    // Recorro el Map y creo un elemento por cada entrada
    for (const [nombre, habitantes] of ciudades) {
        // Contenedor para cada ciudad
        const cont = document.createElement("div");
        cont.className = "ciudad";

        // Texto con nombre y habitantes
        const texto = document.createElement("div");
        texto.textContent = `${nombre} — ${habitantes.toLocaleString()} habitantes`;

        // Div para los botones/acciones de esta ciudad
        const acciones = document.createElement("div");
        acciones.className = "acciones";

        // Botón borrar (elimina la ciudad del Map)
        const btnBorrar = document.createElement("button");
        btnBorrar.textContent = "Borrar";
        btnBorrar.title = `Borrar ${nombre}`;

        btnBorrar.addEventListener("click", () => {
            const confirmar = confirm(`¿Seguro que quieres borrar la ciudad "${nombre}"?`);
            if (!confirmar) return;

            ciudades.delete(nombre);
            editarLista();
            infoAccion.textContent = `Se borró la ciudad "${nombre}".`;
        });

        // Botón editar (permite modificar el nombre y habitantes)
        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.title = `Editar ${nombre}`;

        btnEditar.addEventListener("click", () => {
            // Pedimos nuevos valores
            const nuevoNombre = prompt("Nuevo nombre de la ciudad:", nombre);
            if (!nuevoNombre || !nuevoNombre.trim()) {
                infoAccion.textContent = "Nombre de ciudad no válido.";
                return;
            }
            const nuevoHabitantesStr = prompt("Nuevo número de habitantes:", habitantes);
            const nuevoHabitantes = parseInt(nuevoHabitantesStr, 10);
            if (isNaN(nuevoHabitantes) || nuevoHabitantes < 0) {
                infoAccion.textContent = "Número de habitantes no válido.";
                return;
            }

            // Si el nombre cambió y ya existe, avisamos
            if (nuevoNombre !== nombre && ciudades.has(nuevoNombre)) {
                infoAccion.textContent = `Ya existe una ciudad llamada "${nuevoNombre}".`;
                return;
            }

            // Actualizamos el Map
            ciudades.delete(nombre);
            ciudades.set(nuevoNombre, nuevoHabitantes);

            editarLista();
            infoAccion.textContent = `Ciudad editada: "${nuevoNombre}" con ${nuevoHabitantes.toLocaleString()} habitantes.`;
        });

        // Añadimos los botones al contenedor de acciones
        acciones.appendChild(btnBorrar);
        acciones.appendChild(btnEditar);

        // Pongo el texto y las acciones dentro del contenedor principal
        cont.appendChild(texto);
        cont.appendChild(acciones);

        // Añado el contenedor a la lista principal en el HTML
        listaCiudadesDiv.appendChild(cont);
    }
}
/**
 * añadir ciudad
 */
btnAñadir.addEventListener("click", () => {
  const nombre = inputCiudad.value.trim(); // quito espacios al principio/final
  const habitantes = parseInt(inputHabitantes.value, 10);

  // Validaciones sencillas
  if (!nombre) {
    infoAccion.textContent = "Introduce un nombre de ciudad válido.";
    return;
  }
  if (isNaN(habitantes) || habitantes < 0) {
    infoAccion.textContent = "Introduce un número de habitantes válido (0 o mayor).";
    return;
  }

  // Guardo en el Map (si existía, se actualiza)
  ciudades.set(nombre, habitantes);

  // Limpio los inputs para dejarlo listo para añadir otra ciudad
  inputCiudad.value = "";
  inputHabitantes.value = "";

  // Pinto la lista actualizada y muestro mensaje
  pintarLista();
  infoAccion.textContent = `Ciudad "${nombre}" añadida/actualizada con ${habitantes.toLocaleString()} habitantes.`;
});

// Mostrar lista (puede servir como "actualizar")
btnMostrar.addEventListener("click", () => {
  pintarLista();
  infoAccion.textContent = "Lista actualizada.";
});

// Contar ciudades
btnContar.addEventListener("click", () => {
  infoAccion.textContent = `En el Map hay ${ciudades.size} ciudad(es).`;
});


// Ciudad con más habitantes -> resaltado rojo
btnMas.addEventListener("click", () => {
  if (ciudades.size === 0) {
    infoAccion.textContent = "No hay ciudades para evaluar.";
    return;
  }

  // Buscamos la entrada con mayor número de habitantes
  let ciudadMax = null;
  let maxHabitantes = -Infinity; // valor inicial muy pequeño

  for (const [nombre, habitantes] of ciudades) {
    if (habitantes > maxHabitantes) {
      maxHabitantes = habitantes;
      ciudadMax = nombre;
    }
  }

  // Quitamos cualquier resaltado previo y resaltamos la ciudad encontrada
  limpiarResaltados();

  // Recorremos los elementos visibles y añadimos la clase al que coincida
  const elementos = listaCiudadesDiv.querySelectorAll(".ciudad");
  elementos.forEach(el => {
    const texto = el.firstChild.textContent || "";
    if (texto.startsWith(ciudadMax + " ")) { // empiezo con "Nombre — ..."
      el.firstChild.classList.add("resaltado-rojo");
    }
  });

  infoAccion.textContent = `La ciudad con más habitantes es "${ciudadMax}" con ${maxHabitantes.toLocaleString()} habitantes.`;
});

// Ciudad con menos habitantes -> resaltado verde
btnMenos.addEventListener("click", () => {
  if (ciudades.size === 0) {
    infoAccion.textContent = "No hay ciudades para evaluar.";
    return;
  }

  let ciudadMin = null;
  let minHabitantes = Infinity; // valor inicial muy grande

  for (const [nombre, habitantes] of ciudades) {
    if (habitantes < minHabitantes) {
      minHabitantes = habitantes;
      ciudadMin = nombre;
    }
  }

  limpiarResaltados();

  const elementos = listaCiudadesDiv.querySelectorAll(".ciudad");
  elementos.forEach(el => {
    const texto = el.firstChild.textContent || "";
    if (texto.startsWith(ciudadMin + " ")) {
      el.firstChild.classList.add("resaltado-verde");
    }
  });

  infoAccion.textContent = `La ciudad con menos habitantes es "${ciudadMin}" con ${minHabitantes.toLocaleString()} habitantes.`;
});

// Botón para quitar resaltados manualmente
btnLimpiarResaltados.addEventListener("click", () => {
  limpiarResaltados();
  infoAccion.textContent = "Se han quitado los resaltados.";
});

document.addEventListener("DOMContentLoaded", () => {
  pintarLista(); // mostramos la lista desde el principio
  infoAccion.textContent = "Lista cargada. Puedes añadir, borrar o evaluar ciudades.";
});
