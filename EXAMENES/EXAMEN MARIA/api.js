const API_URL = 'server.php';

// EXAMEN: BORRAR SI NO PIDEN LISTAR (GET)
export const getProductos = async () => (await fetch(API_URL)).json();

// EXAMEN: BORRAR SI NO PIDEN BUSCADOR (GET CON PARÁMETRO)
export const buscarProductos = async (termino) => (await fetch(`${API_URL}?buscar=${termino}`)).json();

// EXAMEN: BORRAR SI NO PIDEN CREAR (POST)
export const crearProducto = async (producto) => {
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(producto) });
    if(!res.ok) throw await res.json();
    return await res.json();
};

// EXAMEN: BORRAR SI NO PIDEN EDITAR (PUT)
export const actualizarProducto = async (producto) => {
    const res = await fetch(API_URL, { method: 'PUT', body: JSON.stringify(producto) });
    if(!res.ok) throw await res.json();
    return await res.json();
};

// EXAMEN: BORRAR SI NO PIDEN ELIMINAR (DELETE)
export const borrarProducto = async (id) => {
    const res = await fetch(API_URL, { method: 'DELETE', body: JSON.stringify({ id }) });
    if(!res.ok) throw await res.json();
    return await res.json();
};