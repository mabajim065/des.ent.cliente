<?php
// 1. CONFIGURACIÓN DE CABECERAS (Para que JS no se queje)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 2. CONEXIÓN A LA BASE DE DATOS (PDO)
$servidor = "localhost";
$usuario = "root";       // Por defecto en XAMPP
$password = "";          // Por defecto en XAMPP está vacía
$nombreBD = "curso_ajax";

try {
    // Intentamos conectar
    $conexion = new PDO("mysql:host=$servidor;dbname=$nombreBD;charset=utf8", $usuario, $password);
    // Configuramos para que lance errores si algo falla
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Si falla la conexión, devolvemos error JSON y paramos
    echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
    exit;
}

// 3. RECIBIR LA ACCIÓN (¿Qué quiere hacer JS?)
// Miramos en $_GET (URL) o en $_POST (Formulario)
$accion = $_REQUEST['accion'] ?? '';

// 4. LÓGICA DEL CRUD
try {
    switch ($accion) {
        
        // --- LEER (SELECT) ---
        case 'listar':
            // Preparamos la consulta
            $sentencia = $conexion->prepare("SELECT * FROM usuarios ORDER BY id DESC");
            $sentencia->execute();
            
            // Convertimos los datos a un array asociativo
            $usuarios = $sentencia->fetchAll(PDO::FETCH_ASSOC);
            
            // Devolvemos JSON
            echo json_encode($usuarios);
            break;

        // --- GUARDAR (INSERT o UPDATE) ---
        case 'guardar':
            // Recibimos los datos del formulario (FormData)
            $id = $_POST['id'] ?? '';
            $nombre = $_POST['nombre'] ?? '';
            $correo = $_POST['correo'] ?? '';

            // Validación básica
            if (empty($nombre) || empty($correo)) {
                echo json_encode(["error" => "Nombre y correo son obligatorios"]);
                exit;
            }

            if ($id) {
                // UPDATE: Si viene un ID, actualizamos
                $sql = "UPDATE usuarios SET nombre = ?, correo = ? WHERE id = ?";
                $sentencia = $conexion->prepare($sql);
                $sentencia->execute([$nombre, $correo, $id]);
                echo json_encode(["mensaje" => "Usuario actualizado"]);
            } else {
                // INSERT: Si NO hay ID, creamos uno nuevo
                $sql = "INSERT INTO usuarios (nombre, correo) VALUES (?, ?)";
                $sentencia = $conexion->prepare($sql);
                $sentencia->execute([$nombre, $correo]);
                echo json_encode(["mensaje" => "Usuario creado"]);
            }
            break;

        // --- ELIMINAR (DELETE) ---
        case 'eliminar':
            $id = $_POST['id'] ?? '';

            if ($id) {
                $sentencia = $conexion->prepare("DELETE FROM usuarios WHERE id = ?");
                $sentencia->execute([$id]);
                echo json_encode(["mensaje" => "Usuario eliminado"]);
            } else {
                echo json_encode(["error" => "Falta el ID"]);
            }
            break;

        default:
            echo json_encode(["error" => "Acción no válida o no especificada"]);
            break;
    }

} catch (Exception $e) {
    // Si hay error en la consulta SQL
    http_response_code(500); // Error del servidor
    echo json_encode(["error" => "Error SQL: " . $e->getMessage()]);
}
?>