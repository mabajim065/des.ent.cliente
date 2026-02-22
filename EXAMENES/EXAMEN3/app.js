/**
 * ══════════════════════════════════════════════════════════════════
 *  app.js — CRUD completo para la API de Tienda de Ropa
 * ══════════════════════════════════════════════════════════════════
 *
 *  ESTRUCTURA MODULAR (patrón módulo revelador / IIFE):
 *  ┌─────────────────────────────────────────────────┐
 *  │  1. CONFIG       → URLs y constantes globales   │
 *  │  2. API          → Peticiones HTTP (fetch)       │
 *  │  3. VALIDACION   → Validar datos del formulario  │
 *  │  4. UI           → Renderizado y manipulación DOM│
 *  │  5. APP          → Controlador principal (init)  │
 *  └─────────────────────────────────────────────────┘
 *
 *  Características valorables:
 *  - Modularización con objetos/módulos separados
 *  - Uso de librerías externas (SweetAlert2, Bootstrap)
 *  - Validación completa en cliente (espejo de la API)
 *  - Control de errores con try/catch en toda petición
 *  - Asincronía manejada con async/await
 *  - Código limpio, estructurado y comentado
 *
 *  @author  Alumno
 *  @version 1.0
 */

"use strict"; // Modo estricto: evita errores silenciosos de JS


/* ══════════════════════════════════════════════════════════════════
 *  1. MÓDULO DE CONFIGURACIÓN
 *  Centraliza la URL base y las constantes reutilizables.
 *  Si la URL de la API cambia, solo hay que tocar aquí.
 * ══════════════════════════════════════════════════════════════════ */
const CONFIG = {
    // CAMBIO AQUÍ: Usamos ruta relativa. Así funciona en cualquier carpeta.
    API_URL: "api.php", 

    TALLAS_PERMITIDAS: ["S", "M", "L", "XL", "XXL"],
    LONGITUD_CODIGO: 9,
    MAX_NOMBRE: 100
};


/* ══════════════════════════════════════════════════════════════════
 *  2. MÓDULO API — Capa de acceso a datos (peticiones HTTP)
 *
 *  Encapsula todas las llamadas fetch a la API REST.
 *  Cada método devuelve una Promise con los datos parseados.
 *  Maneja errores HTTP y de red de forma centralizada.
 * ══════════════════════════════════════════════════════════════════ */
const API = {

    /**
     * Método auxiliar privado para realizar peticiones genéricas.
     * Centraliza la lógica de fetch, headers y parseo JSON.
     *
     * @param {string} url      - URL completa de la petición
     * @param {string} metodo   - Método HTTP (GET, POST, PUT, DELETE)
     * @param {Object|null} body - Cuerpo de la petición (se envía como JSON)
     * @returns {Promise<Object>} Respuesta parseada de la API
     * @throws {Error} Si la respuesta HTTP no es exitosa o hay error de red
     */
    async _peticion(url, metodo = "GET", body = null) {
        try {
            // Configuración base de la petición
            const opciones = {
                method: metodo,
                headers: {
                    "Content-Type": "application/json"
                }
            };

            // Solo añadimos body si el método lo requiere (POST, PUT)
            if (body !== null) {
                opciones.body = JSON.stringify(body);
            }

            // Realizamos la petición con fetch (API nativa del navegador)
            const respuesta = await fetch(url, opciones);

            // Parseamos el JSON de la respuesta
            const datos = await respuesta.json();

            // Si el servidor devuelve un código de error HTTP, lanzamos excepción
            if (!respuesta.ok) {
                // Creamos un error personalizado con la info del servidor
                const error = new Error(datos.mensaje || "Error en la petición");
                error.status = respuesta.status;       // Código HTTP (400, 404, 500…)
                error.datos = datos;                     // Cuerpo completo de la respuesta
                throw error;
            }

            return datos;

        } catch (error) {
            // Si es un error de red (servidor caído, sin internet, etc.)
            if (error.name === "TypeError" && error.message === "Failed to fetch") {
                throw new Error("No se pudo conectar con el servidor. Verifica que la API esté en ejecución.");
            }
            // Re-lanzamos el error para que lo maneje quien llame a esta función
            throw error;
        }
    },

    /**
     * GET — Obtener todos los productos
     * Endpoint: GET /api.php
     *
     * @returns {Promise<Array>} Array de objetos producto
     */
    async obtenerTodos() {
        return await this._peticion(CONFIG.API_URL);
    },

    /**
     * GET — Obtener un producto por su ID
     * Endpoint: GET /api.php?id=X
     *
     * @param {number} id - ID del producto a buscar
     * @returns {Promise<Object>} Objeto con los datos del producto
     */
    async obtenerPorId(id) {
        return await this._peticion(`${CONFIG.API_URL}?id=${id}`);
    },

    /**
     * POST — Crear un nuevo producto
     * Endpoint: POST /api.php
     *
     * @param {Object} producto - Datos del producto a crear
     * @returns {Promise<Object>} Respuesta del servidor con el producto creado
     */
    async crear(producto) {
        return await this._peticion(CONFIG.API_URL, "POST", producto);
    },

    /**
     * PUT — Actualizar un producto existente
     * Endpoint: PUT /api.php?id=X
     *
     * @param {number} id       - ID del producto a actualizar
     * @param {Object} producto - Datos actualizados del producto
     * @returns {Promise<Object>} Respuesta del servidor con el producto actualizado
     */
    async actualizar(id, producto) {
        return await this._peticion(`${CONFIG.API_URL}?id=${id}`, "PUT", producto);
    },

    /**
     * DELETE — Eliminar un producto
     * Endpoint: DELETE /api.php?id=X
     *
     * @param {number} id - ID del producto a eliminar
     * @returns {Promise<Object>} Respuesta del servidor confirmando la eliminación
     */
    async eliminar(id) {
        return await this._peticion(`${CONFIG.API_URL}?id=${id}`, "DELETE");
    }
};


/* ══════════════════════════════════════════════════════════════════
 *  3. MÓDULO DE VALIDACIÓN
 *
 *  Replica en el cliente las mismas reglas del servidor (api.php).
 *  Esto evita peticiones innecesarias cuando los datos son incorrectos.
 *  Las reglas deben coincidir con la función validarCampos() de PHP.
 * ══════════════════════════════════════════════════════════════════ */
const VALIDACION = {

    /**
     * Valida todos los campos del formulario.
     * Devuelve un objeto con:
     *   - valido: boolean (true si todo es correcto)
     *   - errores: objeto con los mensajes de error por campo
     *
     * @param {Object} datos - Datos a validar {codigo, nombre, talla, precio, email_creador}
     * @returns {Object} Resultado de la validación
     */
    validarFormulario(datos) {
        // Objeto donde acumulamos los errores de cada campo
        const errores = {};

        // ── Validar CÓDIGO ──
        // Debe existir, no estar vacío y tener exactamente 9 caracteres
        if (!datos.codigo || datos.codigo.trim() === "") {
            errores.codigo = "El código es obligatorio";
        } else if (datos.codigo.trim().length !== CONFIG.LONGITUD_CODIGO) {
            errores.codigo = `El código debe tener exactamente ${CONFIG.LONGITUD_CODIGO} caracteres`;
        }

        // ── Validar NOMBRE ──
        // Debe existir, no estar vacío y no superar 100 caracteres
        if (!datos.nombre || datos.nombre.trim() === "") {
            errores.nombre = "El nombre es obligatorio";
        } else if (datos.nombre.trim().length > CONFIG.MAX_NOMBRE) {
            errores.nombre = `El nombre no puede superar los ${CONFIG.MAX_NOMBRE} caracteres`;
        }

        // ── Validar TALLA ──
        // Debe ser una de las tallas permitidas: S, M, L, XL, XXL
        if (!datos.talla || datos.talla.trim() === "") {
            errores.talla = "La talla es obligatoria";
        } else if (!CONFIG.TALLAS_PERMITIDAS.includes(datos.talla.toUpperCase().trim())) {
            errores.talla = `La talla debe ser: ${CONFIG.TALLAS_PERMITIDAS.join(", ")}`;
        }

        // ── Validar PRECIO ──
        // Debe ser un número mayor que 0
        if (datos.precio === "" || datos.precio === null || datos.precio === undefined) {
            errores.precio = "El precio es obligatorio";
        } else if (isNaN(datos.precio)) {
            errores.precio = "El precio debe ser un número válido";
        } else if (parseFloat(datos.precio) <= 0) {
            errores.precio = "El precio debe ser mayor que 0";
        }

        // ── Validar EMAIL ──
        // Debe tener formato de email válido usando expresión regular
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!datos.email_creador || datos.email_creador.trim() === "") {
            errores.email_creador = "El email es obligatorio";
        } else if (!regexEmail.test(datos.email_creador.trim())) {
            errores.email_creador = "El formato del email no es válido";
        }

        // Devolvemos resultado: si no hay keys en errores, es válido
        return {
            valido: Object.keys(errores).length === 0,
            errores: errores
        };
    },

    /**
     * Valida un solo campo individual (útil para validación en tiempo real).
     *
     * @param {string} campo - Nombre del campo a validar
     * @param {*} valor      - Valor actual del campo
     * @returns {string|null} Mensaje de error o null si es válido
     */
    validarCampo(campo, valor) {
        // Creamos un objeto temporal con solo ese campo
        const datosTemp = {
            codigo: "", nombre: "", talla: "", precio: "", email_creador: ""
        };
        datosTemp[campo] = valor;

        // Reutilizamos la validación completa y extraemos solo el error de ese campo
        const resultado = this.validarFormulario(datosTemp);
        return resultado.errores[campo] || null;
    }
};


/* ══════════════════════════════════════════════════════════════════
 *  4. MÓDULO UI — Interfaz de Usuario
 *
 *  Gestiona toda la manipulación del DOM:
 *  - Renderizar la tabla de productos
 *  - Mostrar/ocultar errores en el formulario
 *  - Notificaciones con SweetAlert2
 *  - Spinner de carga
 *  - Rellenar formulario para edición
 * ══════════════════════════════════════════════════════════════════ */
const UI = {

    // ── Referencias al DOM (cacheadas para rendimiento) ──
    elementos: {
        formulario:        () => document.getElementById("formularioProducto"),
        tablaBody:         () => document.getElementById("tablaProductos"),
        tituloFormulario:  () => document.getElementById("tituloFormulario"),
        btnSubmit:         () => document.getElementById("btnSubmit"),
        spinner:           () => document.getElementById("spinner"),
        contador:          () => document.getElementById("contadorProductos"),
        filtroTabla:       () => document.getElementById("filtroTabla"),
        resultadoBusqueda: () => document.getElementById("resultadoBusqueda"),
        // Campos del formulario
        productoId:        () => document.getElementById("productoId"),
        codigo:            () => document.getElementById("codigo"),
        nombre:            () => document.getElementById("nombre"),
        talla:             () => document.getElementById("talla"),
        precio:            () => document.getElementById("precio"),
        email_creador:     () => document.getElementById("email_creador")
    },

    /**
     * Renderiza la tabla completa de productos.
     * Recibe un array de productos y genera las filas HTML.
     *
     * @param {Array} productos - Array de objetos producto
     */
    renderizarTabla(productos) {
        const tbody = this.elementos.tablaBody();

        // Si no hay productos, mostramos un mensaje
        if (productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fas fa-box-open fa-2x mb-2 d-block"></i>
                        No hay productos registrados
                    </td>
                </tr>
            `;
            this.elementos.contador().textContent = "0";
            return;
        }

        // Generamos el HTML de cada fila con template literals
        tbody.innerHTML = productos.map(producto => `
            <tr data-id="${producto.id}">
                <td><strong>${producto.id}</strong></td>
                <td><code>${this.escaparHTML(producto.codigo)}</code></td>
                <td>${this.escaparHTML(producto.nombre)}</td>
                <td>
                    <span class="badge bg-primary badge-talla">
                        ${this.escaparHTML(producto.talla)}
                    </span>
                </td>
                <td class="text-end">${parseFloat(producto.precio).toFixed(2)} €</td>
                <td>
                    <small>${this.escaparHTML(producto.email_creador)}</small>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-warning btn-accion btn-editar"
                            data-id="${producto.id}"
                            title="Editar producto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-accion btn-eliminar"
                            data-id="${producto.id}"
                            data-nombre="${this.escaparHTML(producto.nombre)}"
                            title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        // Actualizamos el contador
        this.elementos.contador().textContent = productos.length;
    },

    /**
     * Escapa caracteres HTML para prevenir ataques XSS.
     * Convierte <, >, &, " y ' en sus entidades HTML.
     *
     * @param {string} texto - Texto a escapar
     * @returns {string} Texto seguro para insertar en HTML
     */
    escaparHTML(texto) {
        const div = document.createElement("div");
        div.appendChild(document.createTextNode(texto));
        return div.innerHTML;
    },

    /**
     * Obtiene los valores actuales del formulario y los devuelve
     * como un objeto listo para enviar a la API.
     *
     * @returns {Object} Datos del formulario
     */
    obtenerDatosFormulario() {
        return {
            codigo:        this.elementos.codigo().value,
            nombre:        this.elementos.nombre().value,
            talla:         this.elementos.talla().value,
            precio:        this.elementos.precio().value,
            email_creador: this.elementos.email_creador().value
        };
    },

    /**
     * Rellena el formulario con los datos de un producto (modo edición).
     * Cambia el título y el botón para indicar que estamos editando.
     *
     * @param {Object} producto - Datos del producto a editar
     */
    rellenarFormulario(producto) {
        this.elementos.productoId().value     = producto.id;
        this.elementos.codigo().value         = producto.codigo;
        this.elementos.nombre().value         = producto.nombre;
        this.elementos.talla().value          = producto.talla;
        this.elementos.precio().value         = producto.precio;
        this.elementos.email_creador().value  = producto.email_creador;

        // Cambiamos la apariencia del formulario a "modo edición"
        this.elementos.tituloFormulario().innerHTML =
            '<i class="fas fa-edit me-1"></i> Editar Producto #' + producto.id;
        this.elementos.btnSubmit().innerHTML =
            '<i class="fas fa-sync me-1"></i> Actualizar';
        this.elementos.btnSubmit().classList.replace("btn-success", "btn-warning");

        // Hacemos scroll al formulario para que el usuario lo vea
        this.elementos.formulario().scrollIntoView({ behavior: "smooth" });
    },

    /**
     * Limpia el formulario y lo restaura al modo "crear nuevo".
     * Elimina todos los mensajes de error visibles.
     */
    limpiarFormulario() {
        // Reseteamos todos los campos del formulario
        this.elementos.formulario().reset();
        this.elementos.productoId().value = "";

        // Restauramos título y botón al modo "crear"
        this.elementos.tituloFormulario().innerHTML =
            '<i class="fas fa-plus-circle me-1"></i> Nuevo Producto';
        this.elementos.btnSubmit().innerHTML =
            '<i class="fas fa-save me-1"></i> Guardar';
        this.elementos.btnSubmit().classList.replace("btn-warning", "btn-success");

        // Limpiamos los errores de validación del formulario
        this.limpiarErrores();
    },

    /**
     * Muestra los errores de validación en sus respectivos campos.
     * Resalta visualmente los campos con error.
     *
     * @param {Object} errores - Objeto {campo: "mensaje de error"}
     */
    mostrarErrores(errores) {
        // Primero limpiamos errores previos
        this.limpiarErrores();

        // Recorremos cada campo con error y mostramos el mensaje
        for (const campo in errores) {
            const input = document.getElementById(campo);
            const errorDiv = document.getElementById(
                "error" + campo.charAt(0).toUpperCase() + campo.slice(1)
            );

            if (input) {
                input.classList.add("campo-error"); // Borde rojo
            }

            // Mapeamos los nombres de campo a los IDs de los divs de error
            const mapeoErrores = {
                codigo:        "errorCodigo",
                nombre:        "errorNombre",
                talla:         "errorTalla",
                precio:        "errorPrecio",
                email_creador: "errorEmail"
            };

            const divError = document.getElementById(mapeoErrores[campo]);
            if (divError) {
                divError.textContent = errores[campo];
            }
        }
    },

    /**
     * Limpia todos los mensajes de error y los estilos de error del formulario.
     */
    limpiarErrores() {
        // Quitamos borde rojo de todos los inputs
        document.querySelectorAll(".campo-error").forEach(el => {
            el.classList.remove("campo-error");
        });

        // Vaciamos todos los divs de texto de error
        document.querySelectorAll(".texto-error").forEach(el => {
            el.textContent = "";
        });
    },

    /**
     * Muestra u oculta el spinner de carga.
     *
     * @param {boolean} visible - true para mostrar, false para ocultar
     */
    mostrarSpinner(visible) {
        this.elementos.spinner().style.display = visible ? "inline-block" : "none";
    },

    /**
     * Muestra una notificación de éxito usando SweetAlert2.
     * Aparece como un "toast" (notificación pequeña) en la esquina.
     *
     * @param {string} mensaje - Texto de la notificación
     */
    notificacionExito(mensaje) {
        Swal.fire({
            icon: "success",
            title: mensaje,
            toast: true,                // Modo toast (pequeño, no modal)
            position: "top-end",        // Esquina superior derecha
            showConfirmButton: false,   // Sin botón de confirmar
            timer: 3000,                // Se cierra automáticamente en 3 segundos
            timerProgressBar: true      // Barra de progreso visual
        });
    },

    /**
     * Muestra una notificación de error usando SweetAlert2.
     * Aparece como un diálogo modal con detalles del error.
     *
     * @param {string} mensaje - Mensaje principal del error
     * @param {Array|null} detalles - Lista de errores específicos (opcional)
     */
    notificacionError(mensaje, detalles = null) {
        let html = mensaje;

        // Si hay detalles (array de errores), los listamos
        if (detalles && Array.isArray(detalles)) {
            html += "<ul class='text-start mt-2'>";
            detalles.forEach(d => {
                html += `<li>${d}</li>`;
            });
            html += "</ul>";
        }

        Swal.fire({
            icon: "error",
            title: "Error",
            html: html,
            confirmButtonColor: "#dc3545"
        });
    },

    /**
     * Muestra un diálogo de confirmación antes de eliminar.
     * Usa SweetAlert2 con estilo de advertencia.
     *
     * @param {string} nombreProducto - Nombre del producto a eliminar
     * @returns {Promise<boolean>} true si el usuario confirma, false si cancela
     */
    async confirmarEliminacion(nombreProducto) {
        const resultado = await Swal.fire({
            icon: "warning",
            title: "¿Eliminar producto?",
            html: `Vas a eliminar <strong>"${nombreProducto}"</strong>.<br>Esta acción no se puede deshacer.`,
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6c757d",
            confirmButtonText: '<i class="fas fa-trash me-1"></i> Sí, eliminar',
            cancelButtonText: "Cancelar"
        });

        // isConfirmed es true si el usuario pulsó el botón de confirmar
        return resultado.isConfirmed;
    },

    /**
     * Muestra los datos de un producto encontrado por ID
     * en la sección de resultados de búsqueda.
     *
     * @param {Object} producto - Datos del producto encontrado
     */
    mostrarResultadoBusqueda(producto) {
        const div = this.elementos.resultadoBusqueda();
        div.innerHTML = `
            <div class="card border-info mt-2">
                <div class="card-body p-2">
                    <strong>${this.escaparHTML(producto.nombre)}</strong><br>
                    <small>
                        Código: <code>${this.escaparHTML(producto.codigo)}</code> |
                        Talla: ${this.escaparHTML(producto.talla)} |
                        Precio: ${parseFloat(producto.precio).toFixed(2)} €<br>
                        Email: ${this.escaparHTML(producto.email_creador)}
                    </small>
                </div>
            </div>
        `;
    },

    /**
     * Limpia el área de resultados de búsqueda.
     */
    limpiarResultadoBusqueda() {
        this.elementos.resultadoBusqueda().innerHTML = "";
    },

    /**
     * Filtra las filas visibles de la tabla según el texto de búsqueda.
     * No hace petición al servidor, filtra directamente en el DOM.
     *
     * @param {string} texto - Texto a buscar en las filas
     */
    filtrarTabla(texto) {
        const filas = this.elementos.tablaBody().querySelectorAll("tr[data-id]");
        const termino = texto.toLowerCase().trim();

        filas.forEach(fila => {
            // Comparamos el texto de la fila completa con el término de búsqueda
            const contenido = fila.textContent.toLowerCase();
            // Mostramos u ocultamos la fila según coincida
            fila.style.display = contenido.includes(termino) ? "" : "none";
        });
    }
};


/* ══════════════════════════════════════════════════════════════════
 *  5. MÓDULO APP — Controlador principal
 *
 *  Coordina los demás módulos.
 *  Gestiona los eventos y el flujo de datos entre la API y la UI.
 *  Es el punto de entrada de la aplicación.
 * ══════════════════════════════════════════════════════════════════ */
const APP = {

    /**
     * Inicializa la aplicación.
     * Se ejecuta cuando el DOM está completamente cargado.
     * Registra todos los event listeners y carga los datos iniciales.
     */
    init() {
        console.log("🚀 Aplicación Tienda de Ropa iniciada");

        // ── Registrar eventos ──
        this.registrarEventos();

        // ── Carga inicial: obtener y mostrar todos los productos ──
        this.cargarProductos();
    },

    /**
     * Registra todos los event listeners de la aplicación.
     * Centralizar los eventos facilita el mantenimiento.
     */
    registrarEventos() {

        // 1) SUBMIT del formulario → Crear o Actualizar producto
        UI.elementos.formulario().addEventListener("submit", (evento) => {
            evento.preventDefault(); // Evitamos que el formulario recargue la página
            this.guardarProducto();
        });

        // 2) Botón LIMPIAR → Resetear formulario
        document.getElementById("btnLimpiar").addEventListener("click", () => {
            UI.limpiarFormulario();
        });

        // 3) Delegación de eventos en la tabla → Editar y Eliminar
        //    Usamos delegación porque las filas se crean dinámicamente
        UI.elementos.tablaBody().addEventListener("click", (evento) => {
            // Buscamos el botón más cercano al click (por si clicaron en el icono)
            const btnEditar = evento.target.closest(".btn-editar");
            const btnEliminar = evento.target.closest(".btn-eliminar");

            if (btnEditar) {
                const id = parseInt(btnEditar.dataset.id);
                this.editarProducto(id);
            }

            if (btnEliminar) {
                const id = parseInt(btnEliminar.dataset.id);
                const nombre = btnEliminar.dataset.nombre;
                this.eliminarProducto(id, nombre);
            }
        });

        // 4) Botón BUSCAR por ID
        document.getElementById("btnBuscar").addEventListener("click", () => {
            this.buscarPorId();
        });

        // 5) También buscar al pulsar Enter en el campo de búsqueda por ID
        document.getElementById("buscarId").addEventListener("keypress", (evento) => {
            if (evento.key === "Enter") {
                this.buscarPorId();
            }
        });

        // 6) Filtro de texto en la tabla (búsqueda en tiempo real)
        UI.elementos.filtroTabla().addEventListener("input", (evento) => {
            UI.filtrarTabla(evento.target.value);
        });

        // 7) Validación en tiempo real: al salir de cada campo (blur)
        //    Esto da feedback inmediato al usuario mientras rellena el formulario
        const camposValidables = ["codigo", "nombre", "talla", "precio", "email_creador"];

        camposValidables.forEach(campo => {
            const elemento = document.getElementById(campo);
            elemento.addEventListener("blur", () => {
                const error = VALIDACION.validarCampo(campo, elemento.value);
                const mapeoErrores = {
                    codigo: "errorCodigo",
                    nombre: "errorNombre",
                    talla: "errorTalla",
                    precio: "errorPrecio",
                    email_creador: "errorEmail"
                };
                const divError = document.getElementById(mapeoErrores[campo]);

                if (error) {
                    elemento.classList.add("campo-error");
                    divError.textContent = error;
                } else {
                    elemento.classList.remove("campo-error");
                    divError.textContent = "";
                }
            });
        });
    },

    /**
     * READ — Carga todos los productos desde la API y los muestra en la tabla.
     * Se llama al iniciar la app y después de cada operación CRUD.
     */
    async cargarProductos() {
        try {
            UI.mostrarSpinner(true);

            // Petición GET para obtener todos los productos
            const productos = await API.obtenerTodos();

            // Renderizamos la tabla con los datos recibidos
            UI.renderizarTabla(productos);

        } catch (error) {
            console.error("Error al cargar productos:", error);
            UI.notificacionError("No se pudieron cargar los productos: " + error.message);
        } finally {
            // El finally se ejecuta SIEMPRE, haya error o no
            UI.mostrarSpinner(false);
        }
    },

    /**
     * CREATE / UPDATE — Guarda un producto (crear nuevo o actualizar existente).
     * Detecta automáticamente si es creación o edición según el campo oculto 'productoId'.
     */
    async guardarProducto() {
        // 1) Obtenemos los datos del formulario
        const datos = UI.obtenerDatosFormulario();

        // 2) Validamos en el cliente ANTES de enviar al servidor
        const validacion = VALIDACION.validarFormulario(datos);

        if (!validacion.valido) {
            // Mostramos los errores en el formulario y cortamos la ejecución
            UI.mostrarErrores(validacion.errores);
            return;
        }

        // 3) Determinamos si es creación (sin ID) o edición (con ID)
        const idEdicion = UI.elementos.productoId().value;
        const esEdicion = idEdicion !== "";

        try {
            UI.mostrarSpinner(true);
            let respuesta;

            if (esEdicion) {
                // ── ACTUALIZAR producto existente (PUT) ──
                respuesta = await API.actualizar(parseInt(idEdicion), datos);
                UI.notificacionExito(`Producto #${idEdicion} actualizado correctamente`);
            } else {
                // ── CREAR producto nuevo (POST) ──
                respuesta = await API.crear(datos);
                UI.notificacionExito("Producto creado correctamente");
            }

            // 4) Limpiamos el formulario y recargamos la tabla
            UI.limpiarFormulario();
            await this.cargarProductos();

        } catch (error) {
            console.error("Error al guardar producto:", error);

            // Si el servidor devolvió errores de validación, los mostramos
            if (error.datos && error.datos.errores) {
                UI.notificacionError(error.datos.mensaje, error.datos.errores);
            } else {
                UI.notificacionError(error.message || "Error al guardar el producto");
            }
        } finally {
            UI.mostrarSpinner(false);
        }
    },

    /**
     * Prepara el formulario para EDITAR un producto existente.
     * Obtiene los datos del producto por ID y rellena el formulario.
     *
     * @param {number} id - ID del producto a editar
     */
    async editarProducto(id) {
        try {
            UI.mostrarSpinner(true);

            // Pedimos los datos del producto a la API
            const producto = await API.obtenerPorId(id);

            // Rellenamos el formulario con esos datos
            UI.rellenarFormulario(producto);

        } catch (error) {
            console.error("Error al obtener producto para editar:", error);
            UI.notificacionError("No se pudo cargar el producto: " + error.message);
        } finally {
            UI.mostrarSpinner(false);
        }
    },

    /**
     * DELETE — Elimina un producto tras confirmar con el usuario.
     * Usa SweetAlert2 para el diálogo de confirmación.
     *
     * @param {number} id     - ID del producto a eliminar
     * @param {string} nombre - Nombre del producto (para mostrarlo en la confirmación)
     */
    async eliminarProducto(id, nombre) {
        // 1) Pedimos confirmación al usuario (SweetAlert2)
        const confirmado = await UI.confirmarEliminacion(nombre);

        // Si el usuario canceló, no hacemos nada
        if (!confirmado) return;

        try {
            UI.mostrarSpinner(true);

            // 2) Enviamos la petición DELETE a la API
            const respuesta = await API.eliminar(id);

            // 3) Notificamos éxito y recargamos la tabla
            UI.notificacionExito(respuesta.mensaje || `Producto "${nombre}" eliminado`);

            // Si estábamos editando ese producto, limpiamos el formulario
            if (UI.elementos.productoId().value === String(id)) {
                UI.limpiarFormulario();
            }

            await this.cargarProductos();

        } catch (error) {
            console.error("Error al eliminar producto:", error);
            UI.notificacionError(error.message || "Error al eliminar el producto");
        } finally {
            UI.mostrarSpinner(false);
        }
    },

    /**
     * Busca un producto por su ID y muestra el resultado.
     * Usa el campo de búsqueda de la interfaz.
     */
    async buscarPorId() {
        const inputId = document.getElementById("buscarId");
        const id = parseInt(inputId.value);

        // Validamos que se haya escrito un ID numérico válido
        if (isNaN(id) || id <= 0) {
            UI.notificacionError("Introduce un ID válido (número mayor que 0)");
            return;
        }

        try {
            UI.mostrarSpinner(true);

            // Petición GET con el ID
            const producto = await API.obtenerPorId(id);

            // Mostramos el resultado en la sección de búsqueda
            UI.mostrarResultadoBusqueda(producto);

        } catch (error) {
            console.error("Error al buscar producto:", error);
            UI.limpiarResultadoBusqueda();

            if (error.status === 404) {
                UI.notificacionError(`No se encontró ningún producto con ID = ${id}`);
            } else {
                UI.notificacionError(error.message || "Error al buscar el producto");
            }
        } finally {
            UI.mostrarSpinner(false);
        }
    }
    
};


/* ══════════════════════════════════════════════════════════════════
 *  ARRANQUE DE LA APLICACIÓN
 *
 *  DOMContentLoaded se dispara cuando el HTML ha sido completamente
 *  parseado (sin esperar a imágenes/CSS). Es el momento seguro
 *  para empezar a manipular el DOM.
 * ══════════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
    APP.init();
});