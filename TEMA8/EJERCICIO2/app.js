// 1. CONEXIONES CON EL HTML: Capturamos los elementos de la pantalla para poder manipularlos
const form = document.getElementById('userForm');
const tabla = document.getElementById('listaUsuarios');
const editIndexInput = document.getElementById('editIndex');

// 2. RUTA DEL SERVIDOR: Le decimos a JS dónde tiene que enviar las peticiones
const API_URL = 'servidor.php';

// Variable global que usaremos como "memoria temporal" para guardar los usuarios que nos lleguen
let usuarios = [];

// 3. FUNCIÓN PARA LEER (GET): Pide los datos al servidor y los guarda
async function cargarUsuarios() {
    try {
        // Hacemos la petición al servidor y esperamos su respuesta
        const respuesta = await fetch(API_URL);
        // Traducimos la respuesta que viene en formato texto (JSON) a algo que JS entienda (un Array)
        const datos = await respuesta.json();

        // Comprobamos por seguridad que realmente nos ha llegado una lista (Array)
        if (Array.isArray(datos)) {
            usuarios = datos; // Guardamos los datos en nuestra memoria temporal
            renderizarTabla(); // Llamamos a la función que los dibuja en pantalla
        } else {
            console.error("Error del servidor:", datos);
        }
    } catch (error) {
        console.error("Fallo de conexión:", error); // Por si se cae el servidor o no hay internet
    }
}

// 4. FUNCIÓN PARA DIBUJAR: Coge la lista de usuarios y crea las filas de la tabla
function renderizarTabla() {
    // Primero, vaciamos la tabla para que no se dupliquen los datos al recargar
    tabla.innerHTML = "";

    // Por cada usuario en nuestra lista, creamos una fila (tr) con sus datos
    usuarios.forEach((user) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.nombre}</td>
            <td>${user.correo}</td>
            <td>${user.movil}</td>
            <td>${user.edad}</td>
            <td>${user.idioma}</td>
            <td>
                <button class="btn-editar" onclick="prepararEdicion(${user.id})">Editar</button>
                <button class="btn-borrar" onclick="borrarUsuario(${user.id})">Borrar</button>
            </td>
        `;
        tabla.appendChild(tr); // Añadimos la fila recién creada al HTML
    });
}

// 5. FUNCIÓN PARA GUARDAR O ACTUALIZAR (POST / PUT): Se activa al enviar el formulario
form.addEventListener('submit', async (e) => {
    // Evitamos que la página se recargue (comportamiento por defecto de los formularios)
    e.preventDefault();

    const idUsuario = editIndexInput.value;

    // Empaquetamos los datos que el usuario ha escrito en las cajas de texto
    const datosUsuario = {
        nombre: document.getElementById('nombre').value,
        correo: document.getElementById('correo').value,
        movil: document.getElementById('movil').value,
        edad: document.getElementById('edad').value,
        idioma: document.getElementById('idioma').value
    };

    // Por defecto, asumimos que vamos a crear un usuario nuevo (POST)
    let metodo = 'POST';

    // Pero si el ID no es "-1", significa que estamos modificando a alguien que ya existe (PUT)
    if (idUsuario !== "-1") {
        metodo = 'PUT';
        datosUsuario.id = idUsuario; // Añadimos el ID al paquete de datos para que el servidor sepa a quién actualizar
    }

    // Enviamos el paquete de datos al servidor
    await fetch(API_URL, {
        method: metodo, // GET, POST, PUT o DELETE
        headers: { 'Content-Type': 'application/json' }, // Le decimos que el idioma en el que le hablamos es JSON
        body: JSON.stringify(datosUsuario) // Convertimos el paquete JS a texto JSON
    });

    // Limpieza tras guardar: reseteamos el formulario y volvemos al estado de "Crear nuevo"
    form.reset();
    editIndexInput.value = "-1";
    document.getElementById('btnSubmit').textContent = "Guardar Usuario";
    
    // Volvemos a pedir la lista al servidor para ver los cambios reflejados
    cargarUsuarios();
});

// 6. FUNCIÓN PARA PREPARAR LA EDICIÓN: Sube los datos de la tabla al formulario
function prepararEdicion(id) {
    // Buscamos en nuestra memoria temporal al usuario que tenga el ID en el que hemos hecho clic
    const user = usuarios.find(u => u.id == id);

    if (user) {
        // Rellenamos las cajas de texto con los datos que hemos encontrado
        document.getElementById('nombre').value = user.nombre;
        document.getElementById('correo').value = user.correo;
        document.getElementById('movil').value = user.movil;
        document.getElementById('edad').value = user.edad;
        document.getElementById('idioma').value = user.idioma;

        // Cambiamos el valor oculto al ID del usuario y cambiamos el texto del botón
        editIndexInput.value = user.id;
        document.getElementById('btnSubmit').textContent = "Actualizar Datos";
    }
}

// 7. FUNCIÓN PARA BORRAR (DELETE): Elimina un usuario
async function borrarUsuario(id) {
    // Preguntamos primero para evitar borrados por accidente
    if (confirm("¿Seguro que quieres borrar este usuario de la base de datos?")) {
        // Enviamos la petición de borrado al servidor pasándole solo el ID
        await fetch(API_URL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        // Recargamos la lista para que el usuario desaparezca de la pantalla
        cargarUsuarios();
    }
}

// Arrancamos el programa pidiendo la lista de usuarios nada más cargar la página
cargarUsuarios();