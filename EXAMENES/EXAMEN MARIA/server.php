<?php
// ==========================================
// CABECERAS (NO BORRAR NUNCA)
// ==========================================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') exit(0);

// ==========================================
// CONEXIÓN A BASE DE DATOS (PDO)
// ==========================================
try {
    $conn = new PDO("mysql:host=127.0.0.1;port=3306;dbname=tienda_ropa;charset=utf8mb4", "root", "root");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión BD: " . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

switch ($method) {
    case 'GET':
        // 🚀 AHORA EL BACKEND ES TONTO: Solo trae todos los datos, sin filtrar nada.
        // Toda la responsabilidad de buscar por texto se la dejamos a JavaScript.
        $stmt = $conn->query("SELECT * FROM productos ORDER BY id DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        try {
            $stmt = $conn->prepare("INSERT INTO productos (codigo, nombre, talla, precio, email_creador) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$data['codigo'], $data['nombre'], $data['talla'], $data['precio'], $data['email_creador']]);
            echo json_encode(["mensaje" => "Producto creado", "id" => $conn->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(400);
            if ($e->getCode() == 23000) echo json_encode(["error" => "El código de producto ya existe."]);
            else echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'PUT':
        try {
            $stmt = $conn->prepare("UPDATE productos SET codigo=?, nombre=?, talla=?, precio=?, email_creador=? WHERE id=?");
            $stmt->execute([$data['codigo'], $data['nombre'], $data['talla'], $data['precio'], $data['email_creador'], $data['id']]);
            echo json_encode(["mensaje" => "Producto actualizado"]);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        try {
            $stmt = $conn->prepare("DELETE FROM productos WHERE id=?");
            $stmt->execute([$data['id']]);
            echo json_encode(["mensaje" => "Producto borrado"]);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;
}
?>