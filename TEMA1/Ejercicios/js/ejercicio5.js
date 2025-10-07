function actualizarEstilo() {
    //tambien lo puedo hacer con un if lo que pasa que tengo que poner addeventlstener pa que me fuera

    // Obtiene el elemento con id "texto", que será el texto al que se aplicarán los estilos
    const texto = document.getElementById("texto");

    // mira si hemos marcado que si o que no y lo pone en negrita
    const negrita = document.getElementById("negrita").value;

    // mira si hemos marcado que si o que no y lo pone curvisa o no
    const cursiva = document.getElementById("cursiva").value;

    // hace lo que hayamo marcado arriba
    texto.style.fontWeight = negrita;  //ambia la negraita o normal
    texto.style.fontStyle = cursiva;   // cambia de cursiva o no cursiva
}