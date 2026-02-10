<?php
// Configuración de la conexión
$servidor = "localhost";
$usuario = "root";
$password = "root";
$base_datos = "curso_ajax";

// conecto con la bs
$conn = new mysqli($servidor, $usuario, $password, $base_datos);

// si falla la conexión, aviso y paro todo
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "No conecta a la BD: " . $conn->connect_error]));
}

// preparo pa que el usuario q es json y que se pueda enra desde cualquier lao
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');

// leer q nos piden y los datos que envian
$metodo = $_SERVER['REQUEST_METHOD'];
$cuerpo = file_get_contents("php://input");
$datos = json_decode($cuerpo, true);

// para ver q es lo que voya hacer
switch ($metodo) {
    case 'GET':
        // pedir todos los usuarios a la tabla
        $sql = "SELECT * FROM usuarios ORDER BY id DESC";
        $resultado = $conn->query($sql);

        $usuarios = [];
        while ($fila = $resultado->fetch_assoc()) {
            $usuarios[] = $fila;
        }
        echo json_encode($usuarios);
        break;

    case 'POST':
        //mete nuevo usuario
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
        // actualizar
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
        // borrar
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
