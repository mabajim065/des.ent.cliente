// html
const form = document.getElementById('userForm');
const tabla = document.getElementById('listaUsuarios');
const editIndexInput = document.getElementById('editIndex');

// url
const API_URL = 'servidor.php';

// Variable para guardar de momento lo que descargue
let usuarios = [];

// Cargar datos del servidor
async function cargarUsuarios() {
    try {
        const respuesta = await fetch(API_URL);
        const datos = await respuesta.json();

        // compruebo si ha llegado un array o un error
        if (Array.isArray(datos)) {
            usuarios = datos;
            renderizarTabla();
        } else {
            console.error("Error del servidor:", datos);
        }
    } catch (error) {
        console.error("Fallo de conexión:", error);
    }
}

// mostrar la tabla
function renderizarTabla() {
    tabla.innerHTML = "";

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
        tabla.appendChild(tr);
    });
}

// guardar
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const idUsuario = editIndexInput.value;

    // cojo los datos del formulario
    const datosUsuario = {
        nombre: document.getElementById('nombre').value,
        correo: document.getElementById('correo').value,
        movil: document.getElementById('movil').value,
        edad: document.getElementById('edad').value,
        idioma: document.getElementById('idioma').value
    };

    let metodo = 'POST';

    // Si tiene ID po lo cambio a editar
    if (idUsuario !== "-1") {
        metodo = 'PUT';
        datosUsuario.id = idUsuario;
    }

    // envio los datos al servidor
    await fetch(API_URL, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosUsuario)
    });

    // Limpio y recargo
    form.reset();
    editIndexInput.value = "-1";
    document.getElementById('btnSubmit').textContent = "Guardar Usuario";
    //pdo la lsta actualizada
    cargarUsuarios();
});

// subir datos al formulario para editar
function prepararEdicion(id) {
    // bbusco el usuario por su ID 
    const user = usuarios.find(u => u.id == id);

    if (user) {
        document.getElementById('nombre').value = user.nombre;
        document.getElementById('correo').value = user.correo;
        document.getElementById('movil').value = user.movil;
        document.getElementById('edad').value = user.edad;
        document.getElementById('idioma').value = user.idioma;

        editIndexInput.value = user.id;
        document.getElementById('btnSubmit').textContent = "Actualizar Datos";
    }
}

//  borrar
async function borrarUsuario(id) {
    if (confirm("¿Seguro que quieres borrar este usuario de la base de datos?")) {
        await fetch(API_URL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        cargarUsuarios();
    }
}


cargarUsuarios();