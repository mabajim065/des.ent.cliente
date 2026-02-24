/**
 * Crea el código HTML de una fila de tabla (<tr>) a partir de un objeto producto
 * @param {Object} producto - Los datos del producto que vienen de la base de datos
 * @returns {String} HTML en formato texto
 */
export const crearFilaProducto = (producto) => {
    // Usamos comillas invertidas (backticks ` `) para poder inyectar variables con ${}
    return `
        <tr>
            <td><strong>${producto.id}</strong></td>
            <td>${producto.codigo}</td>
            <td>${producto.nombre}</td>
            <td>${producto.talla}</td>
            <td>${producto.precio} €</td>
            <td>${producto.email_creador}</td>
            <td>
                <button class="btn-editar" data-id="${producto.id}">Editar</button>
                
                <button class="btn-borrar" data-id="${producto.id}">Borrar</button>
            </td>
        </tr>
    `;
};