const API_URL = 'server.php';

// Trae TODOS los datos de la base de datos de una vez
export const getProductos = async () => (await fetch(API_URL)).json();

// Las operaciones de crear, actualizar y borrar se mantienen intactas
export const crearProducto = async (producto) => {
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(producto) });
    if(!res.ok) throw await res.json();
    return await res.json();
};

export const actualizarProducto = async (producto) => {
    const res = await fetch(API_URL, { method: 'PUT', body: JSON.stringify(producto) });
    if(!res.ok) throw await res.json();
    return await res.json();
};

export const borrarProducto = async (id) => {
    const res = await fetch(API_URL, { method: 'DELETE', body: JSON.stringify({ id }) });
    if(!res.ok) throw await res.json();
    return await res.json();
};