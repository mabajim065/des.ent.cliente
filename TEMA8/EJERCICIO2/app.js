// 1. CONEXIONES CON EL HTML
const form = document.getElementById('userForm');
const tabla = document.getElementById('listaUsuarios');
const editIndexInput = document.getElementById('editIndex');

// 2. RUTA DEL SERVIDOR
const API_URL = 'servidor.php';

// ESTA VARIABLKE LA USO PA GUARDAR EN LA MEMORIA LOS USUARIOS QUE COJO DEL SERVIDOR
let usuarios = [];

// 3. FUNCIÓN PARA LEER 
async function cargarUsuarios() {
    try {
        // PIDO AL SERVIVOR Y ESPERAR SU RESPUESTA
        const respuesta = await fetch(API_URL);
        //TRADUZCO DE JSON A UN ARRAY
        const datos = await respuesta.json();

        // COMPRUEBO QUE HA KLEGAO BIEN
        if (Array.isArray(datos)) {
            usuarios = datos;
            // Y MUESTRO LOS USUARIOS EN LA PANTALLA 
            renderizarTabla(); 
        } else {
            console.error("Error del servidor:", datos);
        }
    } catch (error) {
        console.error("Fallo de conexión:", error); 
    }
}

// 4. FUNCIÓN PARA DIBUJAR
function renderizarTabla() {
    // VACIO LA TABLA
    tabla.innerHTML = "";

    // RECORRO EL ARRAY PARA CERAR LAS FIN¡LAS 
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
        //SE LE AÑADE A LA TABLA 
        tabla.appendChild(tr); 
    });
}

// 5. FUNCIÓN PARA GUARDAR O ACTUALIZAR 
form.addEventListener('submit', async (e) => {
    // PARA QUE NO SE RECARGUE
    e.preventDefault();

    const idUsuario = editIndexInput.value;

    // CREO UN PAQUETE DE DATOS CON LO QUE HAY EN LAS CAJAS DE TEXTO
    const datosUsuario = {
        nombre: document.getElementById('nombre').value,
        correo: document.getElementById('correo').value,
        movil: document.getElementById('movil').value,
        edad: document.getElementById('edad').value,
        idioma: document.getElementById('idioma').value
    };

    //HAGO COMO SI FUERA A CREAR UN USUARIO NUUEVO
    let metodo = 'POST';

    // SI LA ID NO ES -1 ENTONCES E SPQ ESTOY EDITANDO
    if (idUsuario !== "-1") {
        metodo = 'PUT';
        datosUsuario.id = idUsuario; 
    }

    // SE LO ENVIO AL SERVIDOR
    await fetch(API_URL, {
        method: metodo, 
        headers: { 'Content-Type': 'application/json' }, 
        // LO CONVIERTO DE NUEVO A JSON PARA ENVIARLO
        body: JSON.stringify(datosUsuario) 
    });

    // RESETEO TODO PARA QUE TODO VUELVA A ESTAR LIMPIO
    form.reset();
    editIndexInput.value = "-1";
    document.getElementById('btnSubmit').textContent = "Guardar Usuario";
    
    // RECARGO PARA VER LOS CAMBIOS 
    cargarUsuarios();
});

// 6. FUNCIÓN PARA PREPARAR LA EDICIÓN: Sube los datos de la tabla al formulario
function prepararEdicion(id) {
    // 
    const user = usuarios.find(u => u.id == id);

    if (user) {
        // SUBO  LOS DATOS DEL USUARIO A LAS CAJAS DE TEXTO PARA QUE SE PUEDAN EDITAR
        document.getElementById('nombre').value = user.nombre;
        document.getElementById('correo').value = user.correo;
        document.getElementById('movil').value = user.movil;
        document.getElementById('edad').value = user.edad;
        document.getElementById('idioma').value = user.idioma;

        // GUARDO EL ID EN UN CAMPO OCULTO PARA SABER QUE USUARIO ESTOY EDITANDO
        editIndexInput.value = user.id;
        document.getElementById('btnSubmit').textContent = "Actualizar Datos";
    }
}

// 7. FUNCIÓN PARA BORRAR 
async function borrarUsuario(id) {
    // PREGUNTO SI ESTÁ SEGURO DE QUE QUIERE BORRAR, PORQUE ES UNA ACCIÓN IRREVERSIBLE
    if (confirm("¿Seguro que quieres borrar este usuario de la base de datos?")) {
        // LE ENVIO AL SERVIDOR LA ID DEL USUARIO QUE QUIERO BORRAR
        await fetch(API_URL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        // Y RECARGO LA LISTA PARA VER LOS CAMBIOS
        cargarUsuarios();
    }
}

// CARGO LOS USUARIOS CAUNDO ABRI LA PAGINA
cargarUsuarios();