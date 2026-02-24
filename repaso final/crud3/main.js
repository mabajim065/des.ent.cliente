// main.js
import { getUsuarios, saveUsuario, deleteUsuario } from './api.js';
import { UserRow } from './components.js'; 

console.log("🟢 main.js: Módulos cargados correctamente");

let state = {
    usuarios: []
};

// 1. RENDERIZADO
function render() {
    const html = state.usuarios.map(user => UserRow(user)).join('');
    document.getElementById('tablaUsuarios').innerHTML = html;
}

// 2. INICIO
async function init() {
    try {
        state.usuarios = await getUsuarios();
        render();
        console.log("🟢 Datos pintados en la tabla");
    } catch (error) {
        console.error("Error al cargar:", error);
    }
}

// 3. EVENTOS DE LA TABLA 
const tabla = document.getElementById('tablaUsuarios');

tabla.addEventListener('click', async (e) => {
    // PROFESIONAL: Usar .closest()
    // Busca el elemento <button> más cercano al clic (por si diste en el icono)
    const btn = e.target.closest('button');

    // Si pulsamos en la tabla pero fuera de un botón, no hacemos nada
    if (!btn) return;

    // Cogemos el ID del botón (dataset.id)
    const id = btn.dataset.id;
    console.log("🖱 Click detectado en botón:", btn.className, "ID:", id);

    // CASO A: BORRAR
    if (btn.classList.contains('btn-borrar')) {
        if (confirm("¿Seguro que quieres borrar este usuario?")) {
            await deleteUsuario(id);
            init(); // Recargar la tabla
        }
    }

    // CASO B: EDITAR
    if (btn.classList.contains('btn-editar')) {
        const user = state.usuarios.find(u => u.id == id);
        // Rellenamos el formulario
        document.getElementById('userId').value = user.id;
        document.getElementById('nombre').value = user.nombre;
        document.getElementById('correo').value = user.correo;
        console.log("✏ Cargando datos en formulario:", user.nombre);
    }
});

// 4. EVENTOS DEL FORMULARIO
const form = document.getElementById('formUsuario');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datos = new FormData(form);
    datos.append('accion', 'guardar'); // Necesario para tu PHP nativo

    try {
        await saveUsuario(datos);
        form.reset();
        document.getElementById('userId').value = ''; // Limpiar ID oculto
        init();
        alert("¡Guardado con éxito!");
    } catch (error) {
        console.error("Error al guardar:", error);
    }
});

// Arrancar
init();