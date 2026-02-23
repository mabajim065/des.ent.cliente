import { getProductos, buscarProductos, crearProducto, actualizarProducto, borrarProducto } from './api.js';
import { crearFilaProducto } from './components.js';

// ESTADO GLOBAL
let estadoProductos = []; // Aquí guardamos lo que viene de la BD
let productosFiltrados = []; // EXAMEN: Usamos esta variable auxiliar para pintar sin machacar los datos originales
let ordenAscendente = true; // Variable para saber si ordenamos de mayor a menor o al revés

// ==========================================
// 1. RENDERIZADO Y CÁLCULO DE TOTALES
// ==========================================
const cargarProductos = async () => {
    try {
        estadoProductos = await getProductos();
        productosFiltrados = [...estadoProductos]; // Copiamos el array
        renderizarTabla();
    } catch (e) {
        Swal.fire('Error', 'Fallo al conectar con el servidor', 'error');
    }
};

const renderizarTabla = () => {
    const tbody = document.getElementById('lista-productos');
    if(tbody) tbody.innerHTML = productosFiltrados.map(p => crearFilaProducto(p)).join('');
    
    // EXAMEN: BORRAR ESTA LÍNEA SI NO PIDEN CALCULAR EL TOTAL
    calcularTotal(); 
};

// EXAMEN: BORRAR FUNCIÓN SI NO PIDEN CALCULAR EL TOTAL
const calcularTotal = () => {
    const totalElement = document.getElementById('total-precio');
    if (!totalElement) return;
    
    // Nivel Avanzado: Uso de reduce() para sumar
    const suma = productosFiltrados.reduce((acumulador, producto) => {
        return acumulador + parseFloat(producto.precio);
    }, 0);
    
    totalElement.textContent = suma.toFixed(2) + ' €';
};

// ==========================================
// 2. BUSCADOR, FILTROS Y ORDENACIÓN (BORRAR LO QUE NO PIDAN)
// ==========================================

// Búsqueda por texto en el servidor
document.getElementById('btn-buscar')?.addEventListener('click', async () => {
    const termino = document.getElementById('input-busqueda').value.trim();
    if (!termino) return Swal.fire('Aviso', 'Escribe algo para buscar', 'info');
    
    estadoProductos = await buscarProductos(termino);
    productosFiltrados = [...estadoProductos];
    // EXAMEN: Si buscaron algo, reseteamos el select de talla
    if(document.getElementById('select-talla')) document.getElementById('select-talla').value = 'TODAS'; 
    renderizarTabla();
});

// EXAMEN: BORRAR SI NO PIDEN FILTRAR POR SELECT (TALLA)
document.getElementById('select-talla')?.addEventListener('change', (e) => {
    const tallaSeleccionada = e.target.value;
    if (tallaSeleccionada === 'TODAS') {
        productosFiltrados = [...estadoProductos]; // Restauramos
    } else {
        // Nivel Avanzado: Uso de filter()
        productosFiltrados = estadoProductos.filter(producto => producto.talla.toUpperCase() === tallaSeleccionada);
    }
    renderizarTabla();
});

// EXAMEN: BORRAR SI NO PIDEN ORDENAR
document.getElementById('btn-ordenar-precio')?.addEventListener('click', () => {
    // Nivel Avanzado: Uso de sort()
    productosFiltrados.sort((a, b) => {
        if (ordenAscendente) return parseFloat(a.precio) - parseFloat(b.precio); // Menor a Mayor
        else return parseFloat(b.precio) - parseFloat(a.precio); // Mayor a Menor
    });
    
    ordenAscendente = !ordenAscendente; // Cambiamos el estado para el próximo click
    renderizarTabla();
});

// Botón para resetear todo a su estado inicial
document.getElementById('btn-limpiar')?.addEventListener('click', () => {
    if(document.getElementById('input-busqueda')) document.getElementById('input-busqueda').value = '';
    if(document.getElementById('select-talla')) document.getElementById('select-talla').value = 'TODAS';
    cargarProductos();
});

// ==========================================
// 3. FORMULARIO POST / PUT (BORRAR SI NO PIDEN CREAR/EDITAR)
// ==========================================
const form = document.getElementById('form-producto');
form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(form).entries());

    // Validaciones JS FRONTEND
    if (datos.codigo.length !== 9) return Swal.fire('Error', 'El código debe tener exactamente 9 caracteres', 'error');
    if (parseFloat(datos.precio) <= 0) return Swal.fire('Error', 'El precio debe ser positivo', 'error');

    try {
        if (datos.id) {
            await actualizarProducto(datos);
            Swal.fire('Éxito', 'Producto actualizado', 'success');
        } else {
            await crearProducto(datos);
            Swal.fire('Éxito', 'Producto creado', 'success');
        }
        form.reset();
        document.getElementById('producto-id').value = '';
        if(document.getElementById('btn-cancelar')) document.getElementById('btn-cancelar').style.display = 'none';
        
        cargarProductos(); // Refrescamos la tabla desde el servidor
    } catch (error) {
        Swal.fire('Error Backend', error.error || 'Fallo desconocido', 'error');
    }
});

document.getElementById('btn-cancelar')?.addEventListener('click', () => {
    form.reset();
    document.getElementById('producto-id').value = '';
    document.getElementById('btn-cancelar').style.display = 'none';
});

// ==========================================
// 4. DELEGACIÓN DE EVENTOS EN TABLA (EDITAR / BORRAR)
// ==========================================
document.getElementById('lista-productos')?.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    // BORRAR
    if (e.target.classList.contains('btn-borrar')) {
        const confirmar = await Swal.fire({ title: '¿Borrar producto?', icon: 'warning', showCancelButton: true });
        if (confirmar.isConfirmed) {
            await borrarProducto(id);
            Swal.fire('Borrado', 'Eliminado de la BD', 'success');
            cargarProductos();
        }
    }

    // EDITAR (Cargar datos al formulario)
    if (e.target.classList.contains('btn-editar')) {
        // Buscamos en el estado original
        const prod = estadoProductos.find(p => p.id == id);
        Object.keys(prod).forEach(key => {
            if(document.getElementById(key)) document.getElementById(key).value = prod[key];
        });
        document.getElementById('producto-id').value = prod.id;
        if(document.getElementById('btn-cancelar')) document.getElementById('btn-cancelar').style.display = 'inline-block';
        window.scrollTo(0,0);
    }
});

// Arrancar App
document.addEventListener('DOMContentLoaded', cargarProductos);