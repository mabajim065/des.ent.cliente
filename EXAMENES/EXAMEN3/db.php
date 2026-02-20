<?php
// db.php - Módulo de conexión a la base de datos
class Database {
    private $host = "localhost";
    private $db_name = "tienda_ropa";
    private $username = "root"; // Pon tu usuario de MySQL (en XAMPP suele ser root)
    private $password = "";     // Pon tu contraseña (en XAMPP suele estar vacío)
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            // Utilizamos PDO porque permite mejor control de errores y sentencias preparadas
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8mb4");
            // Configuramos PDO para que lance excepciones en caso de error
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            http_response_code(500); // Código HTTP de Error Interno del Servidor
            echo json_encode(["error" => "Error de conexión a BBDD: " . $exception->getMessage()]);
            exit;
        }
        return $this->conn;
    }
}
?>