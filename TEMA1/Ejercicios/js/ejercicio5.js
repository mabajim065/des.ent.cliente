function actualizarEstilo() {
    const texto = document.getElementById("texto");
    const negrita = document.getElementById("negrita").value;
    const cursiva = document.getElementById("cursiva").value;

    texto.style.fontWeight = negrita;
    texto.style.fontStyle = cursiva;
}