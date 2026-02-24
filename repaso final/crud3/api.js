//const API_URL = './api.php'; // Ajusta tu ruta
export const API_URL = 'http://localhost/dwec/crud3/api.php';
export async function getUsuarios_old() {
const res = await fetch(`${API_URL}?accion=listar`);
if (!res.ok) throw new Error("Error API");
return await res.json();
}

export async function getUsuarios() {
    // 1. Hacemos la petición
    const res = await fetch(`${API_URL}?accion=listar`);

    // 2. OJO: Primero leemos el TEXTO crudo, no el JSON directo
    const texto = await res.text();
    
    // 3. Lo mostramos en consola para ver el error real
    console.log("Lo que devuelve el servidor:", texto);

    // 4. Intentamos convertirlo a JSON (aquí es donde fallaba antes)
    try {
        return JSON.parse(texto);
    } catch (e) {
        console.error("No es un JSON válido. Revisa el PHP.");
        throw e; // Relanzamos el error
    }
}


export async function saveUsuario(datos) {
const res = await fetch(API_URL, { method: 'POST', body: datos });
return await res.json();
}
export async function deleteUsuario(id) {
const datos = new FormData();
datos.append('accion', 'eliminar');
datos.append('id', id);
const res = await fetch(API_URL, { method: 'POST', body: datos });
return await res.json();
}