<?php
/*
 * ============================================================
 *  db.php — Conexión a la base de datos tienda_ropa
 * ============================================================
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'usuario');
define('DB_NAME', 'tienda_ropa');
define('DB_CHARSET', 'utf8');

$conexion = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conexion->connect_error) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500);
    echo json_encode([
        "error"   => true,
        "mensaje" => "Error de conexión: " . $conexion->connect_error
    ]);
    exit();
}

$conexion->set_charset(DB_CHARSET);
?>