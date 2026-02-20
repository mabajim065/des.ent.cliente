<?php
// api.php - Controlador principal CRUD
header("Access-Control-Allow-Origin: *"); // Permite peticiones desde cualquier origen (CORS)
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Modularización: incluimos la base de datos
include_once 'db.php';

$database = new Database();
$db = $database->getConnection();

// Capturamos el método de la petición (GET, POST, PUT, DELETE)
$method = $_SERVER['REQUEST_METHOD'];

// Función para validar datos correctamente del formulario
function validarDatos($data)
{
    if (empty($data->codigo) || strlen($data->codigo) !== 9) return "Error: El código debe tener exactamente 9 caracteres.";
    if (empty($data->nombre)) return "Error: El nombre es obligatorio.";
    if (empty($data->talla)) return "Error: La talla es obligatoria.";
    if (!is_numeric($data->precio) || $data->precio <= 0) return "Error: El precio debe ser un número positivo.";
    if (empty($data->email_creador) || !filter_var($data->email_creador, FILTER_VALIDATE_EMAIL)) return "Error: Formato de email inválido.";
    return true; // Pasa la validación
}

try {
    switch ($method) {
        // ----------------- READ (LEER) -----------------
        case 'GET':
            if (isset($_GET['id'])) {
                // Leer un solo registro
                $query = "SELECT * FROM productos WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $_GET['id']);
                $stmt->execute();
                $producto = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($producto) {
                    http_response_code(200); // OK
                    echo json_encode($producto);
                } else {
                    http_response_code(404); // No encontrado
                    echo json_encode(["mensaje" => "Producto no encontrado."]);
                }
            } else {
                // Leer todos los registros
                $query = "SELECT * FROM productos";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode($productos);
            }
            break;

        // ----------------- CREATE (CREAR) -----------------
        case 'POST':
            // Recibimos los datos JSON enviados desde JS asíncronamente
            $data = json_decode(file_get_contents("php://input"));
            $validacion = validarDatos($data);

            if ($validacion === true) {
                $query = "INSERT INTO productos (codigo, nombre, talla, precio, email_creador) VALUES (:codigo, :nombre, :talla, :precio, :email)";
                $stmt = $db->prepare($query);

                // Sanitizamos y bindeamos datos (Seguridad contra inyecciones SQL)
                $stmt->bindParam(':codigo', htmlspecialchars(strip_tags($data->codigo)));
                $stmt->bindParam(':nombre', htmlspecialchars(strip_tags($data->nombre)));
                $stmt->bindParam(':talla', htmlspecialchars(strip_tags($data->talla)));
                $stmt->bindParam(':precio', htmlspecialchars(strip_tags($data->precio)));
                $stmt->bindParam(':email', htmlspecialchars(strip_tags($data->email_creador)));

                if ($stmt->execute()) {
                    http_response_code(201); // Creado
                    echo json_encode(["mensaje" => "Producto creado con éxito."]);
                } else {
                    http_response_code(503); // Servicio no disponible
                    echo json_encode(["error" => "No se pudo crear el producto."]);
                }
            } else {
                http_response_code(400); // Bad Request (Error de validación)
                echo json_encode(["error" => $validacion]);
            }
            break;

        // ----------------- UPDATE (ACTUALIZAR) -----------------
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));

            if (isset($_GET['id'])) {
                $validacion = validarDatos($data);
                if ($validacion === true) {
                    $query = "UPDATE productos SET codigo = :codigo, nombre = :nombre, talla = :talla, precio = :precio, email_creador = :email WHERE id = :id";
                    $stmt = $db->prepare($query);

                    $stmt->bindParam(':codigo', htmlspecialchars(strip_tags($data->codigo)));
                    $stmt->bindParam(':nombre', htmlspecialchars(strip_tags($data->nombre)));
                    $stmt->bindParam(':talla', htmlspecialchars(strip_tags($data->talla)));
                    $stmt->bindParam(':precio', htmlspecialchars(strip_tags($data->precio)));
                    $stmt->bindParam(':email', htmlspecialchars(strip_tags($data->email_creador)));
                    $stmt->bindParam(':id', $_GET['id']);

                    if ($stmt->execute()) {
                        http_response_code(200);
                        echo json_encode(["mensaje" => "Producto actualizado correctamente."]);
                    } else {
                        http_response_code(503);
                        echo json_encode(["error" => "No se pudo actualizar el producto."]);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(["error" => $validacion]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "ID no proporcionado para actualizar."]);
            }
            break;

        // ----------------- DELETE (BORRAR) -----------------
        case 'DELETE':
            if (isset($_GET['id'])) {
                $query = "DELETE FROM productos WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $_GET['id']);

                if ($stmt->execute()) {
                    http_response_code(200);
                    echo json_encode(["mensaje" => "Producto eliminado correctamente."]);
                } else {
                    http_response_code(503);
                    echo json_encode(["error" => "No se pudo eliminar el producto."]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "ID no proporcionado para eliminar."]);
            }
            break;

        default:
            http_response_code(405); // Método no permitido
            echo json_encode(["error" => "Método HTTP no soportado."]);
            break;
    }
} catch (Exception $e) {
    // Control de errores general
    http_response_code(500);
    echo json_encode(["error" => "Error interno del servidor: " . $e->getMessage()]);
}
