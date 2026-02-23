/**
 * 
 * @param {*} producto 
 * @returns 
 */
export const crearFilaProducto = (producto) => {
    return `
        <tr>
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