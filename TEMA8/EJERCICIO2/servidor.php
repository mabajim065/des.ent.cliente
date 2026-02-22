<?php
// 1. CONFIGURACIÓN DE SEGURIDAD: Credenciales para entrar a la base de datos
$servidor = "localhost";
$usuario = "root";
$password = "root";
$base_datos = "curso_ajax";

// 2. CONEXIÓN: Intentamos abrir la puerta de la base de datos MySQL
$conn = new mysqli($servidor, $usuario, $password, $base_datos);

// Si la llave no funciona (error de conexión), avisamos al navegador con un error 500 y detenemos todo
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "No conecta a la BD: " . $conn->connect_error]));
}

// 3. CABECERAS: Configuramos las reglas de comunicación
// Decimos que vamos a responder usando el formato JSON
header('Content-Type: application/json');
// Permitimos que nuestra web (que podría estar en otro servidor) hable con este archivo (CORS)
header('Access-Control-Allow-Origin: *');
// Le decimos qué "verbos" están permitidos
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');

// 4. LECTURA DE LA PETICIÓN: Averiguamos qué quiere hacer el JavaScript
$metodo = $_SERVER['REQUEST_METHOD']; // ¿Es GET, POST, PUT o DELETE?
$cuerpo = file_get_contents("php://input"); // Leemos la información cruda que nos llega
$datos = json_decode($cuerpo, true); // Traducimos el texto JSON a un formato que PHP pueda manejar (un array asociativo)

// 5. EL DISTRIBUIDOR (SWITCH): Dependiendo del método, hacemos una cosa u otra
switch ($metodo) {
    case 'GET': // CASO LECTURA: Pedimos todos los usuarios
        // Preparamos la consulta SQL ordenando del más nuevo al más antiguo
        $sql = "SELECT * FROM usuarios ORDER BY id DESC";
        $resultado = $conn->query($sql);

        // Creamos una caja vacía y vamos metiendo a los usuarios uno a uno
        $usuarios = [];
        while ($fila = $resultado->fetch_assoc()) {
            $usuarios[] = $fila;
        }
        // Transformamos la caja de usuarios a formato JSON y se la devolvemos a JS
        echo json_encode($usuarios);
        break;

    case 'POST': // CASO CREACIÓN: Insertamos un usuario nuevo
        // Usamos sentencias preparadas (prepare) por seguridad, para evitar inyecciones SQL
        $stmt = $conn->prepare("INSERT INTO usuarios (nombre, correo, movil, edad, idioma) VALUES (?, ?, ?, ?, ?)");
        // Sustituimos las interrogaciones por los datos reales. "sssis" significa: String, String, String, Integer, String
        $stmt->bind_param("sssis", $datos['nombre'], $datos['correo'], $datos['movil'], $datos['edad'], $datos['idioma']);

        // Si la inserción tiene éxito, devolvemos un mensaje. Si falla, devolvemos un error 500.
        if ($stmt->execute()) {
            echo json_encode(["mensaje" => "Guardado correctamente"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al guardar"]);
        }
        break;

    case 'PUT': // CASO ACTUALIZACIÓN: Modificamos un usuario existente
        // Preparamos el UPDATE basándonos en el ID del usuario
        $stmt = $conn->prepare("UPDATE usuarios SET nombre=?, correo=?, movil=?, edad=?, idioma=? WHERE id=?");
        // "sssisi" indica el tipo de cada dato, acabando con el ID (Integer)
        $stmt->bind_param("sssisi", $datos['nombre'], $datos['correo'], $datos['movil'], $datos['edad'], $datos['idioma'], $datos['id']);

        if ($stmt->execute()) {
            echo json_encode(["mensaje" => "Actualizado correctamente"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al actualizar"]);
        }
        break;

    case 'DELETE': // CASO BORRADO: Eliminamos un usuario
        // Buscamos al usuario por su ID y lo borramos de la tabla
        $stmt = $conn->prepare("DELETE FROM usuarios WHERE id=?");
        // Solo necesitamos el ID (Integer = "i")
        $stmt->bind_param("i", $datos['id']);

        if ($stmt->execute()) {
            echo json_encode(["mensaje" => "Borrado correctamente"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al borrar"]);
        }
        break;
}

// 6. CIERRE: Por buena práctica, cerramos la conexión a la base de datos al terminar
$conn->close();
?>