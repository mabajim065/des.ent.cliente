<?php
/* ══════════════════════════════════════════════════
 *  API REST — TIENDA DE ROPA (CRUD completo)
 *
 *  GET    api.php          → Listar todos
 *  GET    api.php?id=1     → Obtener por ID
 *  POST   api.php          → Crear producto
 *  PUT    api.php?id=1     → Actualizar producto
 *  DELETE api.php?id=1     → Eliminar producto
 * ══════════════════════════════════════════════════ */

/* ── CABECERAS CORS ── */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/* ── CONEXIÓN ── */
require_once 'db.php';

/* ── MÉTODO E ID ── */
$metodo = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

/* ── ENRUTADOR ── */
switch ($metodo) {
    case 'GET':    obtenerProductos($conexion, $id); break;
    case 'POST':   crearProducto($conexion);         break;
    case 'PUT':    actualizarProducto($conexion, $id); break;
    case 'DELETE': eliminarProducto($conexion, $id);  break;
    default:
        http_response_code(405);
        echo json_encode(["error" => true, "mensaje" => "Método no permitido"]);
        break;
}

$conexion->close();
exit();


/* ══════════════════════════════════════════════════
 *  GET — OBTENER PRODUCTOS
 * ══════════════════════════════════════════════════ */
function obtenerProductos($conexion, $id) {
    if ($id !== null) {
        $stmt = $conexion->prepare("SELECT * FROM productos WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $resultado = $stmt->get_result();

        if ($resultado->num_rows === 0) {
            http_response_code(404);
            echo json_encode(["error" => true, "mensaje" => "Producto no encontrado"]);
        } else {
            echo json_encode($resultado->fetch_assoc());
        }
        $stmt->close();
        return;
    }

    $resultado = $conexion->query("SELECT * FROM productos ORDER BY id ASC");
    $productos = [];
    while ($fila = $resultado->fetch_assoc()) {
        $productos[] = $fila;
    }
    echo json_encode($productos);
}


/* ══════════════════════════════════════════════════
 *  POST — CREAR PRODUCTO
 * ══════════════════════════════════════════════════ */
function crearProducto($conexion) {
    $datos = json_decode(file_get_contents("php://input"), true);

    if ($datos === null) {
        http_response_code(400);
        echo json_encode(["error" => true, "mensaje" => "JSON inválido"]);
        return;
    }

    $errores = validarCampos($datos);
    if (!empty($errores)) {
        http_response_code(400);
        echo json_encode(["error" => true, "mensaje" => "Errores de validación", "errores" => $errores]);
        return;
    }

    $codigo = trim($datos['codigo']);
    $nombre = trim($datos['nombre']);
    $talla  = strtoupper(trim($datos['talla']));
    $precio = (float)$datos['precio'];
    $email  = trim($datos['email_creador']);

    // Comprobar duplicado
    $check = $conexion->prepare("SELECT id FROM productos WHERE codigo = ?");
    $check->bind_param("s", $codigo);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["error" => true, "mensaje" => "Ya existe un producto con ese código"]);
        $check->close();
        return;
    }
    $check->close();

    $stmt = $conexion->prepare("INSERT INTO productos (codigo, nombre, talla, precio, email_creador) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssds", $codigo, $nombre, $talla, $precio, $email);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            "error" => false,
            "mensaje" => "Producto creado correctamente",
            "datos" => ["id" => $conexion->insert_id, "codigo" => $codigo, "nombre" => $nombre, "talla" => $talla, "precio" => $precio, "email_creador" => $email]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => true, "mensaje" => "Error al insertar: " . $stmt->error]);
    }
    $stmt->close();
}


/* ══════════════════════════════════════════════════
 *  PUT — ACTUALIZAR PRODUCTO
 * ══════════════════════════════════════════════════ */
function actualizarProducto($conexion, $id) {
    if ($id === null) {
        http_response_code(400);
        echo json_encode(["error" => true, "mensaje" => "Falta ?id=X"]);
        return;
    }

    $check = $conexion->prepare("SELECT id FROM productos WHERE id = ?");
    $check->bind_param("i", $id);
    $check->execute();
    if ($check->get_result()->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["error" => true, "mensaje" => "Producto no encontrado"]);
        $check->close();
        return;
    }
    $check->close();

    $datos = json_decode(file_get_contents("php://input"), true);
    if ($datos === null) {
        http_response_code(400);
        echo json_encode(["error" => true, "mensaje" => "JSON inválido"]);
        return;
    }

    $errores = validarCampos($datos);
    if (!empty($errores)) {
        http_response_code(400);
        echo json_encode(["error" => true, "mensaje" => "Errores de validación", "errores" => $errores]);
        return;
    }

    $codigo = trim($datos['codigo']);
    $nombre = trim($datos['nombre']);
    $talla  = strtoupper(trim($datos['talla']));
    $precio = (float)$datos['precio'];
    $email  = trim($datos['email_creador']);

    // Comprobar que el código no pertenezca a OTRO producto
    $dup = $conexion->prepare("SELECT id FROM productos WHERE codigo = ? AND id != ?");
    $dup->bind_param("si", $codigo, $id);
    $dup->execute();
    if ($dup->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["error" => true, "mensaje" => "Código ya asignado a otro producto"]);
        $dup->close();
        return;
    }
    $dup->close();

    $stmt = $conexion->prepare("UPDATE productos SET codigo=?, nombre=?, talla=?, precio=?, email_creador=? WHERE id=?");
    $stmt->bind_param("sssdsi", $codigo, $nombre, $talla, $precio, $email, $id);

    if ($stmt->execute()) {
        echo json_encode([
            "error" => false,
            "mensaje" => "Producto actualizado correctamente",
            "datos" => ["id" => $id, "codigo" => $codigo, "nombre" => $nombre, "talla" => $talla, "precio" => $precio, "email_creador" => $email]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => true, "mensaje" => "Error al actualizar"]);
    }
    $stmt->close();
}


/* ══════════════════════════════════════════════════
 *  DELETE — ELIMINAR PRODUCTO
 * ══════════════════════════════════════════════════ */
function eliminarProducto($conexion, $id) {
    if ($id === null) {
        http_response_code(400);
        echo json_encode(["error" => true, "mensaje" => "Falta ?id=X"]);
        return;
    }

    $check = $conexion->prepare("SELECT id, nombre FROM productos WHERE id = ?");
    $check->bind_param("i", $id);
    $check->execute();
    $res = $check->get_result();
    if ($res->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["error" => true, "mensaje" => "Producto no encontrado"]);
        $check->close();
        return;
    }
    $prod = $res->fetch_assoc();
    $check->close();

    $stmt = $conexion->prepare("DELETE FROM productos WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(["error" => false, "mensaje" => "Producto '{$prod['nombre']}' eliminado"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => true, "mensaje" => "Error al eliminar"]);
    }
    $stmt->close();
}


/* ══════════════════════════════════════════════════
 *  VALIDACIÓN
 * ══════════════════════════════════════════════════ */
function validarCampos($datos) {
    $errores = [];
    $tallasPermitidas = ['S', 'M', 'L', 'XL', 'XXL'];

    if (!isset($datos['codigo']) || strlen(trim($datos['codigo'])) !== 9)
        $errores[] = "El código debe tener exactamente 9 caracteres";

    if (!isset($datos['nombre']) || trim($datos['nombre']) === '')
        $errores[] = "El nombre es obligatorio";
    elseif (strlen(trim($datos['nombre'])) > 100)
        $errores[] = "El nombre no puede superar 100 caracteres";

    if (!isset($datos['talla']) || !in_array(strtoupper(trim($datos['talla'])), $tallasPermitidas))
        $errores[] = "Talla no válida. Permitidas: " . implode(', ', $tallasPermitidas);

    if (!isset($datos['precio']) || !is_numeric($datos['precio']) || (float)$datos['precio'] <= 0)
        $errores[] = "El precio debe ser un número mayor que 0";

    if (!isset($datos['email_creador']) || !filter_var(trim($datos['email_creador']), FILTER_VALIDATE_EMAIL))
        $errores[] = "Email no válido";

    return $errores;
}
?>