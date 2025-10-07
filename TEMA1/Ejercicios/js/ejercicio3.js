function mostrarTexto() {
    const texto = document.getElementById("textoInput").value;
    //getelementbyid sirve pa mostrarlo 
    document.getElementById("resultado").textContent = texto;
}