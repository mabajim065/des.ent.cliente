// Cargar datos al iniciar
let usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];
const form = document.getElementById('userForm');
const tabla = document.getElementById('listaUsuarios');
const editIndexInput = document.getElementById('editIndex');

// Función para pintar la tabla
function renderizarTabla() {
    tabla.innerHTML = "";
    usuarios.forEach((user, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.nombre}</td>
            <td>${user.correo}</td>
            <td>${user.movil}</td>
            <td>${user.edad}</td>
            <td>${user.idioma}</td>
            <td>
                <button class="btn-editar" onclick="prepararEdicion(${index})">Editar</button>
                <button class="btn-borrar" onclick="borrarUsuario(${index})">Borrar</button>
            </td>
        `;
        tabla.appendChild(tr);
    });
}

// Guardar o Actualizar
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const index = parseInt(editIndexInput.value);
    const nuevoUsuario = {
        nombre: document.getElementById('nombre').value,
        correo: document.getElementById('correo').value,
        movil: document.getElementById('movil').value,
        edad: document.getElementById('edad').value,
        idioma: document.getElementById('idioma').value
    };

    if (index === -1) {
        // Crear nuevo
        usuarios.push(nuevoUsuario);
    } else {
        // Actualizar existente
        usuarios[index] = nuevoUsuario;
        editIndexInput.value = "-1";
        document.getElementById('btnSubmit').textContent = "Guardar Usuario";
    }

    sincronizar();
    form.reset();
});

// Función para borrar (Requisito Proyecto B)
function borrarUsuario(index) {
    if(confirm("¿Seguro que quieres eliminar este registro?")) {
        usuarios.splice(index, 1);
        sincronizar();
    }
}

// Función para cargar datos en el formulario y editar (Requisito Proyecto B)
function prepararEdicion(index) {
    const user = usuarios[index];
    document.getElementById('nombre').value = user.nombre;
    document.getElementById('correo').value = user.correo;
    document.getElementById('movil').value = user.movil;
    document.getElementById('edad').value = user.edad;
    document.getElementById('idioma').value = user.idioma;
    
    editIndexInput.value = index;
    document.getElementById('btnSubmit').textContent = "Actualizar Datos";
}

function sincronizar() {
    localStorage.setItem('usuarios_db', JSON.stringify(usuarios));
    renderizarTabla();
}

// Primera carga
renderizarTabla();