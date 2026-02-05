<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'cyberguard');
define('DB_USER', 'root');
define('DB_PASS', '');

// Application settings
define('APP_NAME', 'CyberGuard');
define('BASE_URL', 'http://localhost/cyberguard');
define('SESSION_NAME', 'cyberguard_session');

// Security settings
define('PASSWORD_HASH_COST', 12);
define('SESSION_LIFETIME', 86400); // 24 hours
define('TWOFA_WINDOW', 1); // Time window for 2FA codes

// Start session with security settings
session_set_cookie_params([
    'lifetime' => SESSION_LIFETIME,
    'path' => '/',
    'domain' => '',
    'secure' => isset($_SERVER['HTTPS']), // Auto-detect HTTPS
    'httponly' => true,
    'samesite' => 'Strict'
]);

session_name(SESSION_NAME);
session_start();

// Autoload Composer dependencies
require_once __DIR__ . '/vendor/autoload.php';

// Create database connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    die("Database connection error. Please try again later.");
}

// CSRF protection
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

function csrf_token() {
    return $_SESSION['csrf_token'];
}

function validate_csrf($token) {
    return hash_equals($_SESSION['csrf_token'], $token);
}
?>