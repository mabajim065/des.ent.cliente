<?php
// 1. CARGA AUTOMÁTICA DE LIBRERÍAS (¡Magia!)
require 'vendor/autoload.php';

// Importamos la clase Medoo para usarla
use Medoo\Medoo;

// Configuración de cabeceras (CORS y JSON)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// 2. CONEXIÓN (Mucho más limpia que PDO puro)
try {
    $database = new Medoo([
        'type' => 'mysql',
        'host' => 'localhost',
        'database' => 'curso_ajax',
        'username' => 'root',
        'password' => ''
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error de conexión"]);
    exit;
}

// 3. ENRUTADOR DE ACCIONES
$accion = $_REQUEST['accion'] ?? '';

switch ($accion) {
    case 'listar':
        // SELECT * FROM usuarios
        $data = $database->select("usuarios", "*");
        echo json_encode($data);
        break;

    case 'guardar':
        $id = $_POST['id'] ?? null;
        $nombre = $_POST['nombre'] ?? '';
        $correo = $_POST['correo'] ?? '';

        // Validación básica
        if (empty($nombre) || empty($correo)) {
            echo json_encode(["status" => "error", "mensaje" => "Faltan datos"]);
            exit;
        }

        // MEDOO SE ENCARGA DE ESCRIBIR EL SQL E INYECTAR VALORES
        if ($id) {
            // UPDATE usuarios SET nombre=..., correo=... WHERE id=...
            $database->update("usuarios", [
                "nombre" => $nombre,
                "correo" => $correo
            ], [
                "id" => $id // La condición WHERE
            ]);
            $mensaje = "Usuario actualizado";
        } else {
            // INSERT INTO usuarios (nombre, correo) VALUES (...)
            $database->insert("usuarios", [
                "nombre" => $nombre,
                "correo" => $correo
            ]);
            $mensaje = "Usuario creado";
        }

        // Verificamos si hubo errores (Ej: correo duplicado)
        if ($database->error) {
             // El error[2] contiene el mensaje técnico de SQL
             // Es buena práctica no mostrar el error crudo al usuario final, pero para debug sirve:
             if($database->error[1] == 1062) { // Código MySQL para duplicado
                 echo json_encode(["status" => "error", "mensaje" => "El correo ya existe"]);
             } else {
                 echo json_encode(["status" => "ok", "mensaje" => $mensaje]);
             }
        } else {
            echo json_encode(["status" => "ok", "mensaje" => $mensaje]);
        }
        break;

    case 'eliminar':
        $id = $_POST['id'] ?? null;
        
        if ($id) {
            // DELETE FROM usuarios WHERE id = ...
            $database->delete("usuarios", [
                "id" => $id
            ]);
            echo json_encode(["status" => "ok", "mensaje" => "Usuario eliminado"]);
        } else {
            echo json_encode(["status" => "error", "mensaje" => "Falta ID"]);
        }
        break;
        
    default:
        echo json_encode(["status" => "error", "mensaje" => "Acción inválida"]);
        break;
}
?>