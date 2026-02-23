/**
 * ═══════════════════════════════════════════════════════════════════
 *  APP.JS — CRUD Completo · Tienda de Ropa · Examen DWEC
 * 
 *  Funcionalidades implementadas:
 *   1.  CRUD completo (Crear, Leer, Actualizar, Eliminar)
 *   2.  Validación de formularios (cliente)
 *   3.  Manejo de asincronía (async/await + fetch)
 *   4.  Control de errores (try/catch)
 *   5.  Modularización (funciones separadas por responsabilidad)
 *   6.  Librería externa (SweetAlert2)
 *   7.  Búsqueda en tiempo real (debounce)
 *   8.  Filtrado por talla
 *   9.  Ordenación de columnas (asc/desc)
 *  10.  LocalStorage (modo oscuro + preferencias)
 *  11.  Exportar datos (JSON y CSV)
 *  12.  Estadísticas (reduce, Math, etc.)
 *  13.  Modo oscuro
 *  14.  ES6+: arrow functions, template literals, destructuring,
 *        spread, map, filter, reduce, find, some, every, sort
 * ═══════════════════════════════════════════════════════════════════
 */


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 1: CONFIGURACIÓN Y CONSTANTES                      ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/** URL de la API — ajustar si tu carpeta tiene otro nombre */
const API_URL = "api.php";

/** Tallas válidas — coinciden con la BD y el PHP */
const TALLAS_VALIDAS = ["S", "M", "L", "XL", "XXL"];

/** Expresiones regulares para validación */
const REGEX = {
    codigo: /^[0-9]{9}$/,              // Exactamente 9 dígitos
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Formato email básico
};

/** Tiempo de espera del debounce en milisegundos */
const DEBOUNCE_MS = 300;


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 2: ESTADO DE LA APLICACIÓN                         ║
   ║  (Closure: encapsula el estado mutable en un solo lugar)     ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Estado global de la aplicación.
 * Usar un objeto centralizado evita variables sueltas
 * y facilita el control del flujo de datos.
 */
const estado = {
    productos: [],          // Array con todos los productos de la API
    productosFiltrados: [], // Array con los productos tras buscar/filtrar
    ordenCampo: "id",       // Campo por el que se ordena la tabla
    ordenAsc: true,         // true = ascendente, false = descendente
    timerMensaje: null,     // Referencia al setTimeout del mensaje
    modoOscuro: false       // Estado del modo oscuro
};


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 3: REFERENCIAS AL DOM                              ║
   ║  (Se cachean para no buscarlas repetidamente)                ║
   ╚═══════════════════════════════════════════════════════════════╝ */

// ── Formulario ──
const $form       = document.getElementById("formProducto");
const $titulo     = document.getElementById("tituloForm");
const $btnGuardar = document.getElementById("btnGuardar");
const $btnCancel  = document.getElementById("btnCancelar");
const $mensaje    = document.getElementById("mensaje");

// ── Campos del formulario ──
const $id     = document.getElementById("productoId");
const $codigo = document.getElementById("codigo");
const $nombre = document.getElementById("nombre");
const $talla  = document.getElementById("talla");
const $precio = document.getElementById("precio");
const $email  = document.getElementById("email_creador");

// ── Mensajes de error de cada campo ──
const $errCodigo = document.getElementById("errCodigo");
const $errNombre = document.getElementById("errNombre");
const $errTalla  = document.getElementById("errTalla");
const $errPrecio = document.getElementById("errPrecio");
const $errEmail  = document.getElementById("errEmail");

// ── Tabla ──
const $tabla    = document.getElementById("cuerpoTabla");
const $contador = document.getElementById("contador");

// ── Búsqueda y filtros ──
const $inputBusqueda = document.getElementById("inputBusqueda");
const $filtroTalla   = document.getElementById("filtroTalla");

// ── Botones globales ──
const $btnModoOscuro   = document.getElementById("btnModoOscuro");
const $btnExportarJSON = document.getElementById("btnExportarJSON");
const $btnExportarCSV  = document.getElementById("btnExportarCSV");

// ── Estadísticas ──
const $statTotal      = document.getElementById("statTotal");
const $statPrecioMedio = document.getElementById("statPrecioMedio");
const $statPrecioMax   = document.getElementById("statPrecioMax");
const $statPrecioMin   = document.getElementById("statPrecioMin");
const $statTallaModa   = document.getElementById("statTallaModa");


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 4: FUNCIONES UTILIDAD (HELPERS)                    ║
   ║  Funciones genéricas reutilizables                           ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Debounce: retrasa la ejecución de una función hasta que
 * el usuario deje de escribir/interactuar durante X milisegundos.
 * 
 * Concepto: Higher-order function (recibe función, devuelve función)
 * Concepto: Closure (la variable 'timer' se mantiene en el scope)
 * 
 * @param {Function} fn    — Función a ejecutar
 * @param {number}   delay — Milisegundos de espera
 * @returns {Function} — Función con debounce aplicado
 */
function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Formatea un número como precio en euros.
 * @param {number|string} valor — El precio a formatear
 * @returns {string} — Ej: "19.99 €"
 */
const formatearPrecio = (valor) => parseFloat(valor).toFixed(2) + " €";

/**
 * Escapa HTML para prevenir XSS al insertar datos en el DOM.
 * @param {string} texto — Texto potencialmente peligroso
 * @returns {string} — Texto escapado
 */
function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

/**
 * Genera un nombre de archivo con fecha y hora actual.
 * @param {string} extension — "json" o "csv"
 * @returns {string} — Ej: "productos_2024-01-15_14-30.json"
 */
function generarNombreArchivo(extension) {
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora  = ahora.toTimeString().slice(0, 5).replace(":", "-");
    return `productos_${fecha}_${hora}.${extension}`;
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 5: FUNCIONES DE LA API (FETCH + ASYNC/AWAIT)       ║
   ║  Toda la comunicación con el servidor está aquí              ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Petición genérica a la API.
 * Centraliza el fetch, el parseo JSON y el manejo de errores.
 * 
 * @param {string} url      — URL del endpoint
 * @param {object} opciones — Opciones para fetch (method, headers, body)
 * @returns {Promise<object>} — Respuesta parseada
 * @throws {Error} — Si hay error de red o la API devuelve error:true
 */
async function peticionAPI(url, opciones = {}) {
    try {
        // 1) Hacer la petición HTTP
        const respuesta = await fetch(url, opciones);

        // 2) Parsear la respuesta como JSON
        const datos = await respuesta.json();

        // 3) Si la API devuelve error:true, lanzar excepción
        if (datos.error === true) {
            const detalle = Array.isArray(datos.errores)
                ? datos.errores.join(" | ")
                : datos.mensaje;
            throw new Error(detalle);
        }

        return datos;

    } catch (error) {
        // Error de red (servidor apagado, sin internet, CORS, etc.)
        if (error instanceof TypeError) {
            throw new Error("❌ Error de conexión. ¿Está el servidor arrancado?");
        }
        // Re-lanzar errores de la API
        throw error;
    }
}

/**
 * GET — Obtener todos los productos.
 * La API devuelve un array directamente: [{...}, {...}, ...]
 */
async function apiObtenerTodos() {
    const datos = await peticionAPI(API_URL);
    // GET all devuelve array directamente (no tiene propiedad "error" si va bien)
    return Array.isArray(datos) ? datos : [];
}

/**
 * GET — Obtener un producto por su ID.
 * La API devuelve el objeto producto directamente.
 */
async function apiObtenerPorId(id) {
    return await peticionAPI(`${API_URL}?id=${id}`);
}

/**
 * POST — Crear un producto nuevo.
 * @param {object} producto — { codigo, nombre, talla, precio, email_creador }
 */
async function apiCrear(producto) {
    return await peticionAPI(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto)
    });
}

/**
 * PUT — Actualizar un producto existente.
 * @param {number} id       — ID del producto
 * @param {object} producto — Datos actualizados
 */
async function apiActualizar(id, producto) {
    return await peticionAPI(`${API_URL}?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto)
    });
}

/**
 * DELETE — Eliminar un producto por ID.
 * @param {number} id — ID del producto a eliminar
 */
async function apiEliminar(id) {
    return await peticionAPI(`${API_URL}?id=${id}`, {
        method: "DELETE"
    });
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 6: VALIDACIÓN DEL FORMULARIO (CLIENTE)             ║
   ║  Validación antes de enviar datos a la API                   ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Limpia todos los errores visuales de los campos.
 */
function limpiarErrores() {
    // Quitar clase 'invalido' de todos los campos
    [$codigo, $nombre, $talla, $precio, $email].forEach(campo => {
        campo.classList.remove("invalido");
    });

    // Vaciar todos los textos de error
    [$errCodigo, $errNombre, $errTalla, $errPrecio, $errEmail].forEach(span => {
        span.textContent = "";
    });
}

/**
 * Muestra un error en un campo específico.
 * @param {HTMLElement} campo — El input/select
 * @param {HTMLElement} span  — El div de error
 * @param {string}      texto — Mensaje de error
 */
function mostrarErrorCampo(campo, span, texto) {
    campo.classList.add("invalido");
    span.textContent = texto;
}

/**
 * Valida todos los campos del formulario.
 * 
 * @returns {boolean} — true si todo es válido, false si hay errores
 */
function validarFormulario() {
    let valido = true;
    limpiarErrores();

    // ── 1. Código: obligatorio, exactamente 9 dígitos ──
    const codigo = $codigo.value.trim();
    if (!codigo) {
        mostrarErrorCampo($codigo, $errCodigo, "El código es obligatorio.");
        valido = false;
    } else if (!REGEX.codigo.test(codigo)) {
        mostrarErrorCampo($codigo, $errCodigo, "Debe tener 9 dígitos numéricos.");
        valido = false;
    }

    // ── 2. Nombre: obligatorio, máx 100 caracteres ──
    const nombre = $nombre.value.trim();
    if (!nombre) {
        mostrarErrorCampo($nombre, $errNombre, "El nombre es obligatorio.");
        valido = false;
    } else if (nombre.length > 100) {
        mostrarErrorCampo($nombre, $errNombre, "Máximo 100 caracteres.");
        valido = false;
    }

    // ── 3. Talla: obligatoria, dentro de las permitidas ──
    const talla = $talla.value;
    if (!talla) {
        mostrarErrorCampo($talla, $errTalla, "Selecciona una talla.");
        valido = false;
    } else if (!TALLAS_VALIDAS.includes(talla)) {
        mostrarErrorCampo($talla, $errTalla, "Talla no válida.");
        valido = false;
    }

    // ── 4. Precio: obligatorio, numérico, > 0 ──
    const precio = $precio.value;
    if (!precio) {
        mostrarErrorCampo($precio, $errPrecio, "El precio es obligatorio.");
        valido = false;
    } else if (isNaN(precio) || parseFloat(precio) <= 0) {
        mostrarErrorCampo($precio, $errPrecio, "Debe ser mayor que 0.");
        valido = false;
    }

    // ── 5. Email: obligatorio, formato válido ──
    const email = $email.value.trim();
    if (!email) {
        mostrarErrorCampo($email, $errEmail, "El email es obligatorio.");
        valido = false;
    } else if (!REGEX.email.test(email)) {
        mostrarErrorCampo($email, $errEmail, "Formato de email no válido.");
        valido = false;
    }

    return valido;
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 7: MENSAJES GLOBALES                               ║
   ║  Feedback visual para el usuario                             ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Muestra un mensaje debajo del formulario.
 * @param {string} texto — Texto a mostrar
 * @param {string} tipo  — "ok" o "error"
 */
function mostrarMensaje(texto, tipo) {
    if (estado.timerMensaje) clearTimeout(estado.timerMensaje);

    $mensaje.textContent = texto;
    $mensaje.className = tipo === "ok" ? "msg-ok" : "msg-error";

    // Auto-ocultar tras 4 segundos
    estado.timerMensaje = setTimeout(ocultarMensaje, 4000);
}

/** Oculta el mensaje global */
function ocultarMensaje() {
    $mensaje.className = "";
    $mensaje.textContent = "";
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 8: BÚSQUEDA Y FILTRADO                             ║
   ║  Usa .filter() sobre el array de productos en memoria        ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Filtra los productos según el texto de búsqueda y la talla seleccionada.
 * Usa Array.prototype.filter() — método de array ES5+
 * Usa String.prototype.includes() — método ES6+
 */
function aplicarFiltros() {
    const textoBusqueda = $inputBusqueda.value.trim().toLowerCase();
    const tallaFiltro   = $filtroTalla.value;

    // Partimos del array completo y filtramos
    estado.productosFiltrados = estado.productos.filter(producto => {
        // ── Filtro por texto (busca en nombre Y código) ──
        const coincideTexto = !textoBusqueda
            || producto.nombre.toLowerCase().includes(textoBusqueda)
            || producto.codigo.includes(textoBusqueda);

        // ── Filtro por talla ──
        const coincideTalla = !tallaFiltro
            || producto.talla === tallaFiltro;

        // Solo pasa si cumple AMBOS filtros
        return coincideTexto && coincideTalla;
    });

    // Aplicar ordenación al resultado filtrado
    aplicarOrdenacion();

    // Repintar tabla con los resultados
    pintarTabla();

    // Actualizar contador
    $contador.textContent = `Mostrando ${estado.productosFiltrados.length} de ${estado.productos.length} productos`;
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 9: ORDENACIÓN DE COLUMNAS                          ║
   ║  Usa Array.prototype.sort() con comparador personalizado     ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Ordena el array productosFiltrados según el campo y dirección actuales.
 * Usa Array.prototype.sort() con función comparadora.
 * Usa el operador ternario y localeCompare para strings.
 */
function aplicarOrdenacion() {
    const { ordenCampo, ordenAsc } = estado; // Destructuring

    estado.productosFiltrados.sort((a, b) => {
        let valorA = a[ordenCampo];
        let valorB = b[ordenCampo];

        // Si es precio o id, comparar como número
        if (ordenCampo === "precio" || ordenCampo === "id") {
            valorA = parseFloat(valorA);
            valorB = parseFloat(valorB);
            return ordenAsc ? valorA - valorB : valorB - valorA;
        }

        // Si es texto, comparar con localeCompare (respeta acentos)
        valorA = String(valorA).toLowerCase();
        valorB = String(valorB).toLowerCase();
        return ordenAsc
            ? valorA.localeCompare(valorB)
            : valorB.localeCompare(valorA);
    });
}

/**
 * Cambia el campo de ordenación.
 * Si se pulsa la misma columna, invierte la dirección.
 * @param {string} campo — Nombre del campo (id, codigo, nombre, etc.)
 */
function cambiarOrdenacion(campo) {
    if (estado.ordenCampo === campo) {
        // Mismo campo → invertir dirección
        estado.ordenAsc = !estado.ordenAsc;
    } else {
        // Nuevo campo → orden ascendente por defecto
        estado.ordenCampo = campo;
        estado.ordenAsc = true;
    }

    // Actualizar flechas visuales en las cabeceras
    actualizarFlechas();

    // Re-aplicar filtros y repintar
    aplicarFiltros();
}

/**
 * Actualiza las flechas (▲/▼) en las cabeceras de la tabla.
 */
function actualizarFlechas() {
    // Recorrer todas las cabeceras con data-campo
    document.querySelectorAll("thead th[data-campo]").forEach(th => {
        const flecha = th.querySelector(".flecha");
        if (th.dataset.campo === estado.ordenCampo) {
            flecha.textContent = estado.ordenAsc ? "▲" : "▼";
        } else {
            flecha.textContent = "";
        }
    });
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 10: RENDERIZADO DE LA TABLA (DOM)                  ║
   ║  Pinta los productos en el tbody usando template literals    ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Pinta los productos filtrados/ordenados en la tabla.
 * 
 * Conceptos usados:
 *   - Array.prototype.map() → transformar array en HTML
 *   - Template literals → construir HTML dinámico
 *   - Array.prototype.join() → unir strings
 *   - Destructuring → extraer propiedades del objeto
 *   - Event delegation → se asignan eventos después
 */
function pintarTabla() {
    const productos = estado.productosFiltrados;

    // ── Si no hay productos ──
    if (productos.length === 0) {
        $tabla.innerHTML = `
            <tr>
                <td colspan="7" class="estado-tabla">
                    No se encontraron productos.
                </td>
            </tr>
        `;
        return;
    }

    // ── Generar filas con .map() y template literals ──
    $tabla.innerHTML = productos.map(({ id, codigo, nombre, talla, precio, email_creador }) => `
        <tr>
            <td>${id}</td>
            <td>${escaparHTML(codigo)}</td>
            <td>${escaparHTML(nombre)}</td>
            <td>${talla}</td>
            <td>${formatearPrecio(precio)}</td>
            <td>${escaparHTML(email_creador)}</td>
            <td>
                <button class="btn-tabla btn-editar" data-id="${id}">
                    ✏️ Editar
                </button>
                <button class="btn-tabla btn-eliminar" data-id="${id}" data-nombre="${escaparHTML(nombre)}">
                    🗑️ Eliminar
                </button>
            </td>
        </tr>
    `).join("");

    // ── Asignar eventos a los botones ──
    asignarEventosTabla();
}

/**
 * Asigna eventos click a los botones de editar y eliminar.
 * Se ejecuta cada vez que se repinta la tabla.
 * 
 * Usa: querySelectorAll, forEach, addEventListener, dataset, parseInt, arrow functions
 */
function asignarEventosTabla() {
    // Botones EDITAR
    document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", () => cargarParaEditar(parseInt(btn.dataset.id)));
    });

    // Botones ELIMINAR
    document.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", () => {
            confirmarEliminacion(parseInt(btn.dataset.id), btn.dataset.nombre);
        });
    });
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 11: ESTADÍSTICAS                                   ║
   ║  Usa .reduce(), Math.max(), Math.min(), .find()              ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Calcula y muestra estadísticas sobre los productos.
 * 
 * Conceptos usados:
 *   - Array.prototype.reduce() → acumular valores
 *   - Math.max() / Math.min() con spread operator
 *   - Array.prototype.map() → extraer precios
 *   - Object.entries() → convertir objeto a array
 *   - Array.prototype.sort() → ordenar por frecuencia
 */
function actualizarEstadisticas() {
    const productos = estado.productos;

    // ── Total ──
    $statTotal.textContent = productos.length;

    if (productos.length === 0) {
        $statPrecioMedio.textContent = "0 €";
        $statPrecioMax.textContent   = "0 €";
        $statPrecioMin.textContent   = "0 €";
        $statTallaModa.textContent   = "-";
        return;
    }

    // ── Extraer todos los precios con .map() ──
    const precios = productos.map(p => parseFloat(p.precio));

    // ── Precio medio con .reduce() ──
    const suma = precios.reduce((acumulador, precio) => acumulador + precio, 0);
    const media = suma / precios.length;
    $statPrecioMedio.textContent = media.toFixed(2) + " €";

    // ── Precio máximo y mínimo con spread operator + Math ──
    $statPrecioMax.textContent = Math.max(...precios).toFixed(2) + " €";
    $statPrecioMin.textContent = Math.min(...precios).toFixed(2) + " €";

    // ── Talla más común (moda) con .reduce() para contar frecuencias ──
    const frecuencias = productos.reduce((contador, producto) => {
        const talla = producto.talla;
        contador[talla] = (contador[talla] || 0) + 1;
        return contador;
    }, {});

    // Object.entries() convierte {S: 2, M: 5, L: 3} en [["S",2], ["M",5], ["L",3]]
    // Luego .sort() para encontrar la más frecuente
    const tallaModa = Object.entries(frecuencias)
        .sort(([, a], [, b]) => b - a)  // Destructuring en parámetros
        .at(0);                          // .at(0) = primer elemento (ES2022)

    $statTallaModa.textContent = tallaModa ? `${tallaModa[0]} (${tallaModa[1]})` : "-";
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 12: ACCIONES CRUD (formulario ↔ API)               ║
   ║  Crear, Leer en formulario, Actualizar, Eliminar             ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Recoge los datos del formulario en un objeto.
 * @returns {object} — { codigo, nombre, talla, precio, email_creador }
 */
function recogerDatos() {
    return {
        codigo:        $codigo.value.trim(),
        nombre:        $nombre.value.trim(),
        talla:         $talla.value.toUpperCase(),
        precio:        parseFloat($precio.value),
        email_creador: $email.value.trim().toLowerCase()
    };
}

/**
 * Limpia el formulario y vuelve al modo "Crear".
 */
function resetFormulario() {
    $form.reset();
    $id.value = "";
    $titulo.textContent     = "➕ Nuevo Producto";
    $btnGuardar.textContent = "💾 Guardar";
    limpiarErrores();
    ocultarMensaje();
}

/**
 * Carga todos los productos desde la API y repinta todo.
 * Es la función principal que sincroniza la vista con el servidor.
 */
async function cargarProductos() {
    $tabla.innerHTML = `<tr><td colspan="7" class="estado-tabla">⏳ Cargando...</td></tr>`;

    try {
        // Traer datos de la API
        estado.productos = await apiObtenerTodos();

        // Aplicar filtros (que a su vez pinta la tabla)
        aplicarFiltros();

        // Actualizar estadísticas
        actualizarEstadisticas();

    } catch (error) {
        $tabla.innerHTML = `<tr><td colspan="7" class="estado-tabla">❌ ${error.message}</td></tr>`;
    }
}

/**
 * Carga un producto en el formulario para editarlo.
 * Cambia el modo del formulario a "Edición".
 * @param {number} id — ID del producto
 */
async function cargarParaEditar(id) {
    try {
        const producto = await apiObtenerPorId(id);

        // Rellenar cada campo con los datos del producto
        $id.value     = producto.id;
        $codigo.value = producto.codigo;
        $nombre.value = producto.nombre;
        $talla.value  = producto.talla;
        $precio.value = producto.precio;
        $email.value  = producto.email_creador;

        // Cambiar título y botón al modo edición
        $titulo.textContent     = `✏️ Editando: ${producto.nombre}`;
        $btnGuardar.textContent = "💾 Actualizar";

        limpiarErrores();
        mostrarMensaje(`Editando producto ID ${producto.id}`, "ok");

        // Scroll suave al formulario
        $form.scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        mostrarMensaje("❌ " + error.message, "error");
    }
}

/**
 * Confirma y ejecuta la eliminación de un producto.
 * Usa SweetAlert2 si está disponible, sino confirm() nativo.
 * 
 * @param {number} id     — ID del producto
 * @param {string} nombre — Nombre (para el mensaje de confirmación)
 */
async function confirmarEliminacion(id, nombre) {

    // ── Usar SweetAlert2 (librería externa) ──
    if (typeof Swal !== "undefined") {
        const resultado = await Swal.fire({
            title: "¿Eliminar producto?",
            html: `Se eliminará <strong>${nombre}</strong> (ID: ${id}).<br>
                   <small>Esta acción no se puede deshacer.</small>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e74c3c",
            cancelButtonColor: "#95a5a6",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!resultado.isConfirmed) return;
    } else {
        // ── Fallback: confirm() nativo ──
        if (!confirm(`¿Eliminar "${nombre}" (ID: ${id})?`)) return;
    }

    // ── Ejecutar eliminación ──
    try {
        const respuesta = await apiEliminar(id);

        // Si estábamos editando este producto, limpiar formulario
        if (parseInt($id.value) === id) resetFormulario();

        // Recargar datos
        await cargarProductos();

        // Notificación de éxito con SweetAlert2
        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "¡Eliminado!",
                text: respuesta.mensaje,
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            mostrarMensaje("✅ " + respuesta.mensaje, "ok");
        }

    } catch (error) {
        mostrarMensaje("❌ " + error.message, "error");
    }
}

/**
 * Maneja el envío del formulario.
 * Decide si es CREAR (POST) o ACTUALIZAR (PUT).
 */
async function manejarSubmit() {
    // 1) Validar
    if (!validarFormulario()) {
        mostrarMensaje("⚠️ Corrige los errores del formulario.", "error");
        return;
    }

    // 2) Recoger datos
    const datos     = recogerDatos();
    const idEdicion = $id.value;

    try {
        let respuesta;

        if (idEdicion) {
            // ── MODO EDICIÓN → PUT ──
            respuesta = await apiActualizar(parseInt(idEdicion), datos);
        } else {
            // ── MODO CREACIÓN → POST ──
            respuesta = await apiCrear(datos);
        }

        // 3) Éxito
        mostrarMensaje("✅ " + respuesta.mensaje, "ok");
        resetFormulario();
        await cargarProductos();

        // Notificación SweetAlert2
        if (typeof Swal !== "undefined") {
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: respuesta.mensaje,
                showConfirmButton: false,
                timer: 2500
            });
        }

    } catch (error) {
        // 4) Error
        mostrarMensaje("❌ " + error.message, "error");
    }
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 13: LOCALSTORAGE                                   ║
   ║  Guardar y recuperar preferencias del usuario                ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Guarda una preferencia en localStorage.
 * @param {string} clave — Nombre de la preferencia
 * @param {*}      valor — Valor (se convierte a JSON)
 */
function guardarPreferencia(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
        console.warn("No se pudo guardar en localStorage:", error.message);
    }
}

/**
 * Recupera una preferencia de localStorage.
 * @param {string} clave       — Nombre de la preferencia
 * @param {*}      valorDefecto — Valor por defecto si no existe
 * @returns {*} — Valor guardado o el valor por defecto
 */
function obtenerPreferencia(clave, valorDefecto = null) {
    try {
        const guardado = localStorage.getItem(clave);
        return guardado !== null ? JSON.parse(guardado) : valorDefecto;
    } catch (error) {
        console.warn("Error leyendo localStorage:", error.message);
        return valorDefecto;
    }
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 14: MODO OSCURO                                    ║
   ║  Toggle con clase CSS + persistencia en localStorage         ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Alterna entre modo claro y modo oscuro.
 * Guarda la preferencia en localStorage.
 */
function toggleModoOscuro() {
    estado.modoOscuro = !estado.modoOscuro;
    document.body.classList.toggle("oscuro", estado.modoOscuro);

    // Actualizar texto del botón
    $btnModoOscuro.textContent = estado.modoOscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";

    // Guardar preferencia
    guardarPreferencia("modoOscuro", estado.modoOscuro);
}

/**
 * Aplica el modo oscuro si estaba guardado en localStorage.
 */
function aplicarModoGuardado() {
    estado.modoOscuro = obtenerPreferencia("modoOscuro", false);

    if (estado.modoOscuro) {
        document.body.classList.add("oscuro");
        $btnModoOscuro.textContent = "☀️ Modo Claro";
    }
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 15: EXPORTAR DATOS (JSON y CSV)                    ║
   ║  Descarga de archivos generados dinámicamente                ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Descarga un archivo generado en el navegador.
 * Crea un <a> temporal, le asigna un Blob URL y hace click.
 * 
 * @param {string} contenido — Contenido del archivo
 * @param {string} nombre    — Nombre del archivo
 * @param {string} tipo      — MIME type (application/json, text/csv)
 */
function descargarArchivo(contenido, nombre, tipo) {
    // Crear un Blob (objeto binario) con el contenido
    const blob = new Blob([contenido], { type: tipo });

    // Crear URL temporal para el blob
    const url = URL.createObjectURL(blob);

    // Crear enlace temporal, asignar URL y hacer click
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();

    // Liberar la URL temporal
    URL.revokeObjectURL(url);
}

/**
 * Exporta los productos actuales a un archivo JSON.
 */
function exportarJSON() {
    if (estado.productos.length === 0) {
        mostrarMensaje("⚠️ No hay productos para exportar.", "error");
        return;
    }

    const json = JSON.stringify(estado.productos, null, 2);
    descargarArchivo(json, generarNombreArchivo("json"), "application/json");
    mostrarMensaje("📥 Archivo JSON descargado.", "ok");
}

/**
 * Exporta los productos actuales a un archivo CSV.
 * 
 * Conceptos: .map(), .join(), template literals
 */
function exportarCSV() {
    if (estado.productos.length === 0) {
        mostrarMensaje("⚠️ No hay productos para exportar.", "error");
        return;
    }

    // Cabecera CSV
    const cabecera = "ID,Código,Nombre,Talla,Precio,Email";

    // Filas: cada producto como una línea CSV
    const filas = estado.productos.map(({ id, codigo, nombre, talla, precio, email_creador }) =>
        `${id},"${codigo}","${nombre}","${talla}",${precio},"${email_creador}"`
    );

    // Unir cabecera + filas con saltos de línea
    const csv = [cabecera, ...filas].join("\n"); // Spread operator

    descargarArchivo(csv, generarNombreArchivo("csv"), "text/csv");
    mostrarMensaje("📥 Archivo CSV descargado.", "ok");
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 16: REGISTRO DE EVENTOS                            ║
   ║  Todos los addEventListener en un solo lugar                  ║
   ╚═══════════════════════════════════════════════════════════════╝ */

function registrarEventos() {

    // ── Formulario: submit → crear o actualizar ──
    $form.addEventListener("submit", (e) => {
        e.preventDefault();  // Evitar recarga de la página
        manejarSubmit();
    });

    // ── Botón cancelar → limpiar formulario ──
    $btnCancel.addEventListener("click", () => {
        resetFormulario();
    });

    // ── Búsqueda en tiempo real con debounce ──
    // debounce() evita hacer un filtrado por cada tecla;
    // espera a que el usuario deje de escribir 300ms
    $inputBusqueda.addEventListener("input", debounce(() => {
        aplicarFiltros();
    }, DEBOUNCE_MS));

    // ── Filtro por talla → filtrado inmediato ──
    $filtroTalla.addEventListener("change", () => {
        aplicarFiltros();
    });

    // ── Cabeceras de la tabla → ordenación ──
    document.querySelectorAll("thead th[data-campo]").forEach(th => {
        th.addEventListener("click", () => {
            cambiarOrdenacion(th.dataset.campo);
        });
    });

    // ── Modo oscuro ──
    $btnModoOscuro.addEventListener("click", toggleModoOscuro);

    // ── Exportar datos ──
    $btnExportarJSON.addEventListener("click", exportarJSON);
    $btnExportarCSV.addEventListener("click", exportarCSV);

    // ── Limpiar error de un campo al escribir en él ──
    // Usa un array de pares [campo, errorSpan] y forEach
    const paresCampoError = [
        [$codigo, $errCodigo],
        [$nombre, $errNombre],
        [$talla,  $errTalla],
        [$precio, $errPrecio],
        [$email,  $errEmail]
    ];

    paresCampoError.forEach(([campo, errorSpan]) => {
        campo.addEventListener("input", () => {
            campo.classList.remove("invalido");
            errorSpan.textContent = "";
        });
    });
}


/* ╔═══════════════════════════════════════════════════════════════╗
   ║  SECCIÓN 17: INICIALIZACIÓN                                 ║
   ║  Todo arranca cuando el DOM está listo                       ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * Función de inicio.
 * Se ejecuta cuando el DOM está completamente cargado.
 * 
 * Orden de inicialización:
 *   1. Aplicar modo oscuro guardado (localStorage)
 *   2. Registrar todos los eventos
 *   3. Cargar productos de la API
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("🛍️ Tienda de Ropa — App iniciada");

    // 1) Modo oscuro desde localStorage
    aplicarModoGuardado();

    // 2) Registrar eventos
    registrarEventos();

    // 3) Cargar productos (async)
    cargarProductos();
});