<?php
/*
 *  API REST — TIENDA DE ROPA
 */

/* ── CABECERAS CORS ── */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/*  CONEXIÓN */
require_once 'db.php';

/* MÉTODO E ID  */
$metodo = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

/* ENRUTADOR */
switch ($metodo) {
    case 'GET':
        obtenerProductos($conexion, $id);
        break;
    case 'POST':
        crearProducto($conexion);
        break;
    case 'PUT':
        actualizarProducto($conexion, $id);
        break;
    case 'DELETE':
        eliminarProducto($conexion, $id);
        break;
    default:
        http_response_code(405);
        echo json_encode([
            "error"   => true,
            "mensaje" => "Método $metodo no permitido"
        ]);
        break;
}

$conexion->close();
exit();


/* ══════════════════════════════════════════════════════════
   ██  GET — OBTENER PRODUCTOS
   ══════════════════════════════════════════════════════════ */
function obtenerProductos($conexion, $id) {

    if ($id !== null) {
        $stmt = $conexion->prepare("SELECT * FROM productos WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $resultado = $stmt->get_result();

        if ($resultado->num_rows === 0) {
            http_response_code(404);
            echo json_encode([
                "error"   => true,
                "mensaje" => "Producto con id=$id no encontrado"
            ]);
        } else {
            http_response_code(200);
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

    http_response_code(200);
    echo json_encode($productos);
}


/* ══════════════════════════════════════════════════════════
   ██  POST — CREAR PRODUCTO
   ══════════════════════════════════════════════════════════ */
function crearProducto($conexion) {

    $datos = json_decode(file_get_contents("php://input"), true);

    if ($datos === null) {
        http_response_code(400);
        echo json_encode([
            "error"   => true,
            "mensaje" => "El cuerpo de la petición no es JSON válido"
        ]);
        return;
    }

    $errores = validarCampos($datos);
    if (!empty($errores)) {
        http_response_code(400);
        echo json_encode([
            "error"   => true,
            "mensaje" => "Errores de validación",
            "errores" => $errores
        ]);
        return;
    }

    $codigo = trim($datos['codigo']);
    $nombre = trim($datos['nombre']);
    $talla  = strtoupper(trim($datos['talla']));
    $precio = (float)$datos['precio'];
    $email  = trim($datos['email_creador']);

    // Comprobar código duplicado
    $stmtCheck = $conexion->prepare("SELECT id FROM productos WHERE codigo = ?");
    $stmtCheck->bind_param("s", $codigo);
    $stmtCheck->execute();
    if ($stmtCheck->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "error"   => true,
            "mensaje" => "Ya existe un producto con el código '$codigo'"
        ]);
        $stmtCheck->close();
        return;
    }
    $stmtCheck->close();

    $stmt = $conexion->prepare(
        "INSERT INTO productos (codigo, nombre, talla, precio, email_creador)
         VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("sssds", $codigo, $nombre, $talla, $precio, $email);

    if ($stmt->execute()) {
        $nuevoId = $conexion->insert_id;
        http_response_code(201);
        echo json_encode([
            "error"   => false,
            "mensaje" => "Producto creado correctamente",
            "id"      => $nuevoId,
            "datos"   => [
                "id"            => $nuevoId,
                "codigo"        => $codigo,
                "nombre"        => $nombre,
                "talla"         => $talla,
                "precio"        => $precio,
                "email_creador" => $email
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "error"   => true,
            "mensaje" => "Error al insertar: " . $stmt->error
        ]);
    }

    $stmt->close();
}


/* ══════════════════════════════════════════════════════════
   ██  PUT — ACTUALIZAR PRODUCTO
   ══════════════════════════════════════════════════════════ */
function actualizarProducto($conexion, $id) {

    if ($id === null) {
        http_response_code(400);
        echo json_encode([
            "error"   => true,
            "mensaje" => "Debes proporcionar ?id=X en la URL"
        ]);
        return;
    }

    $stmtExiste = $conexion->prepare("SELECT id FROM productos WHERE id = ?");
    $stmtExiste->bind_param("i", $id);
    $stmtExiste->execute();
    if ($stmtExiste->get_result()->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "error"   => true,
            "mensaje" => "Producto con id=$id no encontrado"
        ]);
        $stmtExiste->close();
        return;
    }
    $stmtExiste->close();

    $datos = json_decode(file_get_contents("php://input"), true);

    if ($datos === null) {
        http_response_code(400);
        echo json_encode([
            "error"   => true,
            "mensaje" => "El cuerpo de la petición no es JSON válido"
        ]);
        return;
    }

    $errores = validarCampos($datos);
    if (!empty($errores)) {
        http_response_code(400);
        echo json_encode([
            "error"   => true,
            "mensaje" => "Errores de validación",
            "errores" => $errores
        ]);
        return;
    }

    $codigo = trim($datos['codigo']);
    $nombre = trim($datos['nombre']);
    $talla  = strtoupper(trim($datos['talla']));
    $precio = (float)$datos['precio'];
    $email  = trim($datos['email_creador']);

    // Comprobar que el código no pertenezca a OTRO producto
    $stmtDup = $conexion->prepare("SELECT id FROM productos WHERE codigo = ? AND id != ?");
    $stmtDup->bind_param("si", $codigo, $id);
    $stmtDup->execute();
    if ($stmtDup->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "error"   => true,
            "mensaje" => "El código '$codigo' ya está asignado a otro producto"
        ]);
        $stmtDup->close();
        return;
    }
    $stmtDup->close();

    $stmt = $conexion->prepare(
        "UPDATE productos
         SET codigo = ?, nombre = ?, talla = ?, precio = ?, email_creador = ?
         WHERE id = ?"
    );
    $stmt->bind_param("sssdsi", $codigo, $nombre, $talla, $precio, $email, $id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            "error"   => false,
            "mensaje" => "Producto id=$id actualizado correctamente",
            "datos"   => [
                "id"            => $id,
                "codigo"        => $codigo,
                "nombre"        => $nombre,
                "talla"         => $talla,
                "precio"        => $precio,
                "email_creador" => $email
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "error"   => true,
            "mensaje" => "Error al actualizar: " . $stmt->error
        ]);
    }

    $stmt->close();
}


/* ══════════════════════════════════════════════════════════
   ██  DELETE — ELIMINAR PRODUCTO
   ══════════════════════════════════════════════════════════ */
function eliminarProducto($conexion, $id) {

    if ($id === null) {
        http_response_code(400);
        echo json_encode([
            "error"   => true,
            "mensaje" => "Debes proporcionar ?id=X en la URL"
        ]);
        return;
    }

    $stmtExiste = $conexion->prepare("SELECT id, nombre FROM productos WHERE id = ?");
    $stmtExiste->bind_param("i", $id);
    $stmtExiste->execute();
    $resultado = $stmtExiste->get_result();

    if ($resultado->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "error"   => true,
            "mensaje" => "Producto con id=$id no encontrado"
        ]);
        $stmtExiste->close();
        return;
    }

    $productoEliminado = $resultado->fetch_assoc();
    $stmtExiste->close();

    $stmt = $conexion->prepare("DELETE FROM productos WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            "error"   => false,
            "mensaje" => "Producto '{$productoEliminado['nombre']}' (id=$id) eliminado correctamente"
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "error"   => true,
            "mensaje" => "Error al eliminar: " . $stmt->error
        ]);
    }

    $stmt->close();
}


/* ══════════════════════════════════════════════════════════
   ██  VALIDACIÓN DE CAMPOS
   ══════════════════════════════════════════════════════════ */
function validarCampos($datos) {

    $errores = [];
    $tallasPermitidas = ['S', 'M', 'L', 'XL', 'XXL'];

    if (!isset($datos['codigo']) || trim($datos['codigo']) === '') {
        $errores[] = "El campo 'codigo' es obligatorio";
    } elseif (strlen(trim($datos['codigo'])) !== 9) {
        $errores[] = "El campo 'codigo' debe tener exactamente 9 caracteres";
    }

    if (!isset($datos['nombre']) || trim($datos['nombre']) === '') {
        $errores[] = "El campo 'nombre' es obligatorio";
    } elseif (strlen(trim($datos['nombre'])) > 100) {
        $errores[] = "El campo 'nombre' no puede superar los 100 caracteres";
    }

    if (!isset($datos['talla']) || trim($datos['talla']) === '') {
        $errores[] = "El campo 'talla' es obligatorio";
    } elseif (!in_array(strtoupper(trim($datos['talla'])), $tallasPermitidas)) {
        $errores[] = "El campo 'talla' debe ser: " . implode(', ', $tallasPermitidas);
    }

    if (!isset($datos['precio']) || $datos['precio'] === '') {
        $errores[] = "El campo 'precio' es obligatorio";
    } elseif (!is_numeric($datos['precio'])) {
        $errores[] = "El campo 'precio' debe ser un número válido";
    } elseif ((float)$datos['precio'] <= 0) {
        $errores[] = "El campo 'precio' debe ser mayor que 0";
    }

    if (!isset($datos['email_creador']) || trim($datos['email_creador']) === '') {
        $errores[] = "El campo 'email_creador' es obligatorio";
    } elseif (!filter_var(trim($datos['email_creador']), FILTER_VALIDATE_EMAIL)) {
        $errores[] = "El campo 'email_creador' no tiene formato de email válido";
    }

    return $errores;
}

?>