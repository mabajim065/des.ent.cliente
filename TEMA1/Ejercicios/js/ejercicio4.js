function mostrarimagen() {
    // esto es el cuadradito dode el usuario elege la imagen
    const select = document.getElementById("imagenes");

    //esto coge la imagen que va a ser mostrada
    const img = document.getElementById("imagenMostrada");

    // guarda la que hallamos elegido
    const archivo = select.value;

    // hacemos un if para que si el usuario a elegido una imagen esta se haga visible y se vea y si no no se vea nada
    if (archivo) {
        img.src = archivo;
        img.style.display = "block";
    } else {
        img.src = "";
        img.style.display = "none";
    }
}
