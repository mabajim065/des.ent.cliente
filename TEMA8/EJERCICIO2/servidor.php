<?php
// 1. CONFIGURACIÓN DE SEGURIDADç
$usuario = "root";
$password = "root";
$base_datos = "curso_ajax";

// 2. CONEXIO
$conn = new mysqli($servidor, $usuario, $password, $base_datos);

// SI NO FUNCIONA DOY UN ERROR 500 
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "No conecta a la BD: " . $conn->connect_error]));
}

// 3. CABECERAS
//RESPONDO USANDO UN JDON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');

// 4. LECTURA DE LA PETICIÓN
//MIRO QUE METODO ES EL Q QUIERO 
$metodo = $_SERVER['REQUEST_METHOD']; 
$cuerpo = file_get_contents("php://input"); 
$datos = json_decode($cuerpo, true); 
// 5. DEPENDE DEL METODO PO HAGO UNA COS O OTRA
switch ($metodo) {
    case 'GET': 
        $sql = "SELECT * FROM usuarios ORDER BY id DESC";
        $resultado = $conn->query($sql);

    
        $usuarios = [];
        while ($fila = $resultado->fetch_assoc()) {
            $usuarios[] = $fila;
        }
       
        echo json_encode($usuarios);
        break;

    case 'POST': 
        $stmt = $conn->prepare("INSERT INTO usuarios (nombre, correo, movil, edad, idioma) VALUES (?, ?, ?, ?, ?)");
       
        $stmt->bind_param("sssis", $datos['nombre'], $datos['correo'], $datos['movil'], $datos['edad'], $datos['idioma']);

        if ($stmt->execute()) {
            echo json_encode(["mensaje" => "Guardado correctamente"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al guardar"]);
        }
        break;

    case 'PUT': 
      
        $stmt = $conn->prepare("UPDATE usuarios SET nombre=?, correo=?, movil=?, edad=?, idioma=? WHERE id=?");
      
        $stmt->bind_param("sssisi", $datos['nombre'], $datos['correo'], $datos['movil'], $datos['edad'], $datos['idioma'], $datos['id']);

        if ($stmt->execute()) {
            echo json_encode(["mensaje" => "Actualizado correctamente"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al actualizar"]);
        }
        break;

    case 'DELETE': 
        $stmt = $conn->prepare("DELETE FROM usuarios WHERE id=?");
        
        $stmt->bind_param("i", $datos['id']);

        if ($stmt->execute()) {
            echo json_encode(["mensaje" => "Borrado correctamente"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al borrar"]);
        }
        break;
}


$conn->close();
?>