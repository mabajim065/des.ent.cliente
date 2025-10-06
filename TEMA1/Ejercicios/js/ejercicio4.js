function mostrarImagen() {
    const select = document.getElementById("imagenes");
    const img = document.getElementById("imagenMostrada");
    const archivo = select.value;

    if (archivo) {
        img.src = archivo;
        img.style.display = "block";
    } else {
        img.src = "";
        img.style.display = "none";
    }
}