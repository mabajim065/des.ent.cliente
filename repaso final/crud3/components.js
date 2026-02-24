export function UserRow(user) {
// Retornamos un String (Template Literal) que parece HTML
return `
<tr>
<td>${user.id}</td>
<td><strong>${user.nombre}</strong></td>
<td>${user.correo}</td>
<td>
<button class="btn-editar" data-id="${user.id}">
✏</button>
<button class="btn-borrar" data-id="${user.id}">
🗑</button>
</td>
</tr>
`;
}