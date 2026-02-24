// Importamos las herramientas que necesitamos de los otros archivos
// Fíjate que ya NO importamos 'buscarProductos' porque la búsqueda ahora se hace en el cliente
import { getProductos, crearProducto, actualizarProducto, borrarProducto } from './api.js';
import { crearFilaProducto } from './components.js';

// ==========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
let estadoProductos = []; // Almacén principal: guarda exactamente lo que nos manda la base de datos.
let productosFiltrados = []; // EXAMEN: Usamos esta variable para dibujar la tabla. Si aplicamos filtros, modificamos esta, NO la original.
let ordenAscendente = true; // Controla si la ordenación de la tabla es de Menor a Mayor o viceversa.

// ==========================================
// 1. RENDERIZADO Y CÁLCULO DE TOTALES
// ==========================================

// Función que pide los datos al servidor al arrancar la página
const cargarProductos = async () => {
    try {
        estadoProductos = await getProductos(); // Llamada a la API (trae TODO de golpe)
        productosFiltrados = [...estadoProductos]; // Copiamos los datos para no machacar el almacén principal
        renderizarTabla(); // Dibuja la tabla con los datos nuevos
    } catch (e) {
        Swal.fire('Error', 'Fallo al conectar con el servidor', 'error');
    }
};

// Función encargada exclusivamente de dibujar los datos en el HTML
const renderizarTabla = () => {
    const tbody = document.getElementById('lista-productos');
    // Transforma el array de objetos en un gran texto de etiquetas <tr> y lo inyecta en el tbody
    if(tbody) tbody.innerHTML = productosFiltrados.map(p => crearFilaProducto(p)).join('');
    
    // EXAMEN: BORRAR ESTA LÍNEA SI NO PIDEN CALCULAR EL TOTAL EN EL PIE DE LA TABLA
    calcularTotal(); 
};

// EXAMEN: BORRAR FUNCIÓN COMPLETA SI NO PIDEN CALCULAR EL TOTAL
const calcularTotal = () => {
    const totalElement = document.getElementById('total-precio');
    if (!totalElement) return;
    
    // El método reduce() suma el precio de todos los productos uno por uno.
    // 'acumulador' empieza en 0, y le va sumando 'producto.precio' en cada vuelta.
    const suma = productosFiltrados.reduce((acumulador, producto) => {
        return acumulador + parseFloat(producto.precio);
    }, 0);
    
    // toFixed(2) fuerza a que siempre tenga 2 decimales
    totalElement.textContent = suma.toFixed(2) + ' €';
};

// ==========================================
// 2. BUSCADOR, FILTROS Y ORDENACIÓN (100% EN JAVASCRIPT)
// ==========================================

// BUSCADOR POR TEXTO EN EL FRONTEND
document.getElementById('btn-buscar')?.addEventListener('click', () => {
    // 1. Obtenemos lo que ha escrito el usuario, quitamos espacios y lo pasamos a minúsculas
    const termino = document.getElementById('input-busqueda').value.trim().toLowerCase();
    
    if (!termino) {
        // Si el buscador está vacío, restauramos todos los productos a su estado original
        productosFiltrados = [...estadoProductos];
    } else {
        // 2. Filtramos el array principal (estadoProductos) sin tocar el servidor
        productosFiltrados = estadoProductos.filter(producto => {
            // Pasamos todos los campos a texto y a minúsculas para que la búsqueda no sea sensible a mayúsculas
            const id = String(producto.id).toLowerCase();
            const codigo = String(producto.codigo).toLowerCase();
            const nombre = String(producto.nombre).toLowerCase();
            
            // Si el término de búsqueda está incluido (.includes) en alguno de los 3 campos, nos lo quedamos
            return id.includes(termino) || codigo.includes(termino) || nombre.includes(termino);
        });
        
        // Si la búsqueda no arroja resultados, podemos avisar al usuario
        if (productosFiltrados.length === 0) {
            Swal.fire('Aviso', 'No se encontraron productos con ese término', 'info');
            productosFiltrados = [...estadoProductos]; // Restauramos la vista
            document.getElementById('input-busqueda').value = ''; // Limpiamos el input
        }
    }
    
    // 3. Reiniciamos el select de tallas para evitar que los filtros se solapen y confundan al usuario
    if(document.getElementById('select-talla')) document.getElementById('select-talla').value = 'TODAS'; 
    
    // 4. Redibujamos la tabla con los nuevos datos filtrados localmente
    renderizarTabla();
});

// FILTRAR POR SELECT (EJ: TALLAS)
document.getElementById('select-talla')?.addEventListener('change', (e) => {
    const tallaSeleccionada = e.target.value; // 'S', 'M', 'TODAS'...
    if (tallaSeleccionada === 'TODAS') {
        productosFiltrados = [...estadoProductos]; // Si elige TODAS, volvemos a la copia de seguridad original
    } else {
        // filter() crea un nuevo array SOLO con los productos que cumplan la condición (que la talla coincida)
        productosFiltrados = estadoProductos.filter(producto => producto.talla.toUpperCase() === tallaSeleccionada);
    }
    renderizarTabla(); // Redibujamos la tabla con el nuevo array filtrado
});

// ORDENAR AL HACER CLICK EN UN BOTÓN
document.getElementById('btn-ordenar-precio')?.addEventListener('click', () => {
    // sort() reordena el array. Compara elementos de dos en dos (a y b)
    productosFiltrados.sort((a, b) => {
        if (ordenAscendente) return parseFloat(a.precio) - parseFloat(b.precio); // Si da negativo, 'a' va antes
        else return parseFloat(b.precio) - parseFloat(a.precio); // Si da positivo, 'b' va antes
    });
    
    ordenAscendente = !ordenAscendente; // Invertimos la variable para que el próximo click ordene al revés
    renderizarTabla();
});

// RESETEAR / LIMPIAR TODO
document.getElementById('btn-limpiar')?.addEventListener('click', () => {
    if(document.getElementById('input-busqueda')) document.getElementById('input-busqueda').value = '';
    if(document.getElementById('select-talla')) document.getElementById('select-talla').value = 'TODAS';
    
    // Ya no hace falta llamar a cargarProductos() y gastar red. Restauramos desde la memoria RAM.
    productosFiltrados = [...estadoProductos]; 
    renderizarTabla();
});

// ==========================================
// 3. FORMULARIO POST / PUT (CREAR O EDITAR)
// ==========================================
const form = document.getElementById('form-producto');

form?.addEventListener('submit', async (e) => {
    e.preventDefault(); // EXAMEN: VITAL. Evita que la página se recargue sola al enviar el formulario.
    
    // Obtenemos todos los datos de los inputs de golpe y creamos un objeto con ellos
    const datos = Object.fromEntries(new FormData(form).entries());

    // Validaciones extra en JavaScript antes de enviar al servidor
    if (datos.codigo.length !== 9) return Swal.fire('Error', 'El código debe tener exactamente 9 caracteres', 'error');
    if (parseFloat(datos.precio) <= 0) return Swal.fire('Error', 'El precio debe ser positivo', 'error');

    try {
        // ¿Cómo sabemos si estamos editando o creando? Miramos el input oculto ID.
        if (datos.id) {
            // Si hay ID, el producto ya existe en la BD -> ACTUALIZAR (PUT)
            await actualizarProducto(datos);
            Swal.fire('Éxito', 'Producto actualizado', 'success');
        } else {
            // Si NO hay ID, es un producto nuevo -> CREAR (POST)
            await crearProducto(datos);
            Swal.fire('Éxito', 'Producto creado', 'success');
        }
        
        // Limpiamos el formulario después de guardar
        form.reset();
        document.getElementById('producto-id').value = ''; // Vaciamos el input oculto
        
        // Ocultamos el botón de cancelar edición (si existe)
        if(document.getElementById('btn-cancelar')) document.getElementById('btn-cancelar').style.display = 'none';
        
        // Recargamos la tabla pidiendo los datos al backend para ver los nuevos cambios reflejados
        cargarProductos(); 
    } catch (error) {
        // Si el backend (PHP) lanza un error (ej: código duplicado), lo atrapamos aquí
        Swal.fire('Error Backend', error.error || 'Fallo desconocido', 'error');
    }
});

// BOTÓN PARA CANCELAR LA EDICIÓN
document.getElementById('btn-cancelar')?.addEventListener('click', () => {
    form.reset(); // Vaciamos los inputs
    document.getElementById('producto-id').value = ''; // Limpiamos el ID oculto para volver al modo "Crear"
    document.getElementById('btn-cancelar').style.display = 'none'; // Ocultamos este mismo botón
});

// ==========================================
// 4. DELEGACIÓN DE EVENTOS EN LA TABLA (EDITAR / BORRAR)
// ==========================================
// IMPORTANTE: Como los botones de Editar/Borrar se crean de forma dinámica después de cargar la página,
// no podemos ponerles un 'addEventListener' directo a cada uno. 
// Le ponemos el evento al padre (la tabla) y averiguamos a qué se le hizo click.
document.getElementById('lista-productos')?.addEventListener('click', async (e) => {
    const id = e.target.dataset.id; // Cogemos el 'data-id' del HTML del botón
    if (!id) return; // Si hicimos click en un sitio que no es un botón, no hacemos nada

    // BORRAR PRODUCTO
    if (e.target.classList.contains('btn-borrar')) {
        const confirmar = await Swal.fire({ title: '¿Borrar producto?', icon: 'warning', showCancelButton: true });
        if (confirmar.isConfirmed) {
            await borrarProducto(id); // Llamada a la API
            Swal.fire('Borrado', 'Eliminado de la BD', 'success');
            cargarProductos(); // Refrescamos tabla pidiendo datos actualizados
        }
    }

    // EDITAR PRODUCTO (Rellenar el formulario)
    if (e.target.classList.contains('btn-editar')) {
        // Buscamos el producto en nuestro almacén JS por su ID
        const prod = estadoProductos.find(p => p.id == id);
        
        // Rellenamos el formulario automáticamente. 
        // Recorre las claves del objeto (id, codigo, nombre...) y busca un input con ese mismo 'id' en el HTML
        Object.keys(prod).forEach(key => {
            if(document.getElementById(key)) document.getElementById(key).value = prod[key];
        });
        
        // Aseguramos que el input oculto tenga el ID correcto para pasar a modo "Edición"
        document.getElementById('producto-id').value = prod.id;
        
        // Mostramos el botón de cancelar edición
        if(document.getElementById('btn-cancelar')) document.getElementById('btn-cancelar').style.display = 'inline-block';
        
        // Hacemos scroll hacia arriba para que el usuario vea el formulario
        window.scrollTo(0,0);
    }
});

// ==========================================
// 5. EXPORTAR E IMPORTAR JSON
// EXAMEN: BORRAR TODA ESTA SECCIÓN SI NO TE PIDEN DESCARGAR/CARGAR JSON
// ==========================================

// --- DESCARGAR JSON ---
// Si te piden descargar la tabla filtrada en vez de toda la BD, cambia "estadoProductos" por "productosFiltrados"
document.getElementById('btn-descargar-json')?.addEventListener('click', () => {
    // 1. Convertimos nuestro array de objetos a una cadena de texto en formato JSON
    // El "null, 2" es solo para que el JSON se descargue tabulado y bonito, no todo en una línea
    const textoJSON = JSON.stringify(estadoProductos, null, 2); 
    
    // 2. Creamos un "Blob" (un archivo en la memoria temporal del navegador)
    const archivoBlob = new Blob([textoJSON], { type: 'application/json' });
    
    // 3. Creamos un enlace (<a>) invisible en el HTML
    const url = URL.createObjectURL(archivoBlob);
    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.href = url;
    enlaceDescarga.download = 'mis_productos.json'; // Nombre del archivo que se va a descargar
    
    // 4. Simulamos que el usuario hace click en el enlace para forzar la descarga y luego limpiamos
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();
    document.body.removeChild(enlaceDescarga);
    URL.revokeObjectURL(url); // Liberamos la memoria RAM
});

// --- CARGAR JSON ---
document.getElementById('input-cargar-json')?.addEventListener('change', (e) => {
    // 1. Cogemos el archivo que el usuario ha seleccionado
    const archivo = e.target.files[0];
    if (!archivo) return; // Si cancela la ventana, no hacemos nada

    // 2. Usamos FileReader para leer el contenido del archivo
    const lector = new FileReader();
    
    // 3. Le decimos qué hacer cuando termine de leer el archivo
    lector.onload = async (evento) => {
        try {
            // Transformamos el texto del archivo a un array de JavaScript
            const productosNuevos = JSON.parse(evento.target.result);
            
            // Si no es un array, lanzamos un error para ir al bloque catch
            if (!Array.isArray(productosNuevos)) throw new Error("El JSON no es una lista");

            // Avisamos al usuario de que la carga puede tardar si hay muchos
            Swal.fire({ title: 'Cargando...', text: 'Insertando en la base de datos', showConfirmButton: false });

            // 4. Recorremos el array y guardamos cada producto en la Base de Datos usando la API que ya tienes
            let insertados = 0;
            for (const producto of productosNuevos) {
                try {
                    // EXAMEN: El backend asignará el ID automáticamente. 
                    // Si el producto falla (ej: código duplicado), lo ignoramos y seguimos con el siguiente
                    await crearProducto(producto);
                    insertados++;
                } catch (err) {
                    console.warn(`No se pudo insertar el producto ${producto.codigo}:`, err);
                }
            }
            
            // 5. Refrescamos la tabla y avisamos del resultado
            Swal.fire('¡Terminado!', `Se han insertado ${insertados} productos nuevos en la BD.`, 'success');
            cargarProductos(); // Tu función ya existente para recargar la tabla
            
            // Limpiamos el input file por si quiere volver a subir el mismo archivo
            e.target.value = '';

        } catch (error) {
            Swal.fire('Error', 'El archivo no tiene un formato JSON válido.', 'error');
            e.target.value = ''; // Limpiamos el input
        }
    };
    
    // Le ordenamos que empiece a leer el archivo como texto (esto dispara el onload de arriba)
    lector.readAsText(archivo);
});
// ==========================================
// FIN DE LA SECCIÓN DE EXPORTAR/IMPORTAR JSON
// ==========================================

// ==========================================
// INICIALIZACIÓN
// ==========================================
// Cuando todo el HTML se haya cargado, arrancamos la aplicación pidiendo los datos
document.addEventListener('DOMContentLoaded', cargarProductos);