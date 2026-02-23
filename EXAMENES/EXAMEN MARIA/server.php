<?php
// Cabeceras CORS (No borrar, obligatorias para que JS se comunique con PHP)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

// EXAMEN: Conexión PDO (Asume XAMPP en Windows: root y sin clave)
try {
    $conn = new PDO("mysql:host=localhost;dbname=tienda_ropa", "root", "usuario");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
// Recibimos los datos del fetch (POST, PUT, DELETE)
$data = json_decode(file_get_contents("php://input"), true);

switch ($method) {
    // ==========================================
    // EXAMEN: BORRAR 'GET' SI NO PIDEN MOSTRAR DATOS NI BUSCADOR
    // ==========================================
    case 'GET':
        if (isset($_GET['buscar'])) {
            // Si nos piden buscador extra (busca por nombre o código)
            $termino = "%" . $_GET['buscar'] . "%";
            $stmt = $conn->prepare("SELECT * FROM productos WHERE nombre LIKE :t OR codigo LIKE :t ORDER BY id DESC");
            $stmt->execute([':t' => $termino]);
        } else {
            // Comportamiento normal: sacar todos
            $stmt = $conn->query("SELECT * FROM productos ORDER BY id DESC");
        }
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    // ==========================================
    // EXAMEN: BORRAR 'POST' SI NO PIDEN CREAR/AÑADIR PRODUCTOS
    // ==========================================
    case 'POST':
        try {
            $stmt = $conn->prepare("INSERT INTO productos (codigo, nombre, talla, precio, email_creador) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$data['codigo'], $data['nombre'], $data['talla'], $data['precio'], $data['email_creador']]);
            echo json_encode(["mensaje" => "Producto creado con éxito", "id" => $conn->lastInsertId()]);
        } catch(PDOException $e) {
            http_response_code(400); 
            // Control de error si el código ya existe (UNIQUE en BD)
            if ($e->getCode() == 23000) echo json_encode(["error" => "El código de producto ya existe."]);
            else echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    // ==========================================
    // EXAMEN: BORRAR 'PUT' SI NO PIDEN EDITAR/ACTUALIZAR
    // ==========================================
    case 'PUT':
        try {
            $stmt = $conn->prepare("UPDATE productos SET codigo=?, nombre=?, talla=?, precio=?, email_creador=? WHERE id=?");
            $stmt->execute([$data['codigo'], $data['nombre'], $data['talla'], $data['precio'], $data['email_creador'], $data['id']]);
            echo json_encode(["mensaje" => "Producto actualizado con éxito"]);
        } catch(PDOException $e) {
            http_response_code(400); echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    // ==========================================
    // EXAMEN: BORRAR 'DELETE' SI NO PIDEN ELIMINAR
    // ==========================================
    case 'DELETE':
        try {
            $stmt = $conn->prepare("DELETE FROM productos WHERE id=?");
            $stmt->execute([$data['id']]);
            echo json_encode(["mensaje" => "Producto borrado con éxito"]);
        } catch(PDOException $e) {
            http_response_code(400); echo json_encode(["error" => $e->getMessage()]);
        }
        break;
}
?>