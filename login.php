<?php
require_once 'config.php';
require_once 'TwoFA.php';

$twoFA = new TwoFA();

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate CSRF token
    if (!validate_csrf($_POST['csrf_token'])) {
        die('CSRF validation failed');
    }
    
    $email = filter_var(trim($_POST['email']), FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'];
    
    // Track login attempt
    $ip = $_SERVER['REMOTE_ADDR'];
    $stmt = $pdo->prepare("INSERT INTO login_attempts (email, ip_address, successful) VALUES (?, ?, ?)");
    $stmt->execute([$email, $ip, 0]);
    
    if (!$email) {
        $error = "Invalid email address";
    } else {
        // Check if user exists
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            // Check if 2FA is enabled
            if ($user['twofa_enabled']) {
                // Store user data in session for 2FA verification
                $_SESSION['2fa_user_id'] = $user['id'];
                $_SESSION['2fa_email'] = $user['email'];
                $_SESSION['2fa_remember'] = isset($_POST['remember']);
                
                // Redirect to 2FA verification
                header("Location: verify-2fa.php");
                exit;
            } else {
                // Regular login without 2FA
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['email'] = $user['email'];
                $_SESSION['twofa_enabled'] = false;
                
                // Create session token
                $session_token = bin2hex(random_bytes(32));
                $expires = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
                
                $stmt = $pdo->prepare("INSERT INTO user_sessions (user_id, session_token, twofa_verified, ip_address, user_agent, expires_at) 
                                      VALUES (?, ?, 1, ?, ?, ?)");
                $stmt->execute([$user['id'], $session_token, $ip, $_SERVER['HTTP_USER_AGENT'], $expires]);
                
                setcookie('session_token', $session_token, time() + SESSION_LIFETIME, '/', '', true, true);
                
                // Update login attempt as successful
                $stmt = $pdo->prepare("UPDATE login_attempts SET successful = 1 WHERE email = ? ORDER BY id DESC LIMIT 1");
                $stmt->execute([$email]);
                
                header("Location: dashboard.php");
                exit;
            }
        } else {
            $error = "Invalid email or password";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - CyberGuard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        /* Login form styles - similar to register */
        body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #0f172a, #1e293b);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .login-container {
            background: rgba(30, 41, 59, 0.9);
            border-radius: 15px;
            padding: 2.5rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(100, 255, 218, 0.1);
        }
        
        .logo {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .logo i {
            font-size: 2.5rem;
            color: #64ffda;
            margin-bottom: 1rem;
        }
        
        .logo h1 {
            font-size: 1.8rem;
            color: #fff;
            margin: 0;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #94a3b8;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .form-control {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid #334155;
            border-radius: 8px;
            color: #fff;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #64ffda;
            box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.1);
        }
        
        .btn {
            display: inline-block;
            width: 100%;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #64ffda, #00b894);
            color: #0f172a;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
            text-decoration: none;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(100, 255, 218, 0.3);
        }
        
        .alert {
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
        }
        
        .checkbox-group {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .checkbox-group input {
            margin-right: 0.5rem;
        }
        
        .register-link {
            text-align: center;
            margin-top: 1.5rem;
            color: #94a3b8;
        }
        
        .register-link a {
            color: #64ffda;
            text-decoration: none;
            font-weight: 500;
        }
        
        .twofa-link {
            text-align: center;
            margin-top: 1rem;
        }
        
        .twofa-link a {
            color: #94a3b8;
            text-decoration: none;
            font-size: 0.9rem;
        }
        
        .twofa-link a:hover {
            color: #64ffda;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <i class="fas fa-shield-alt"></i>
            <h1>Welcome Back</h1>
            <p style="color: #94a3b8; font-size: 0.9rem;">Secure login with 2FA protection</p>
        </div>
        
        <?php if (isset($error)): ?>
            <div class="alert">
                <p><?php echo htmlspecialchars($error); ?></p>
            </div>
        <?php endif; ?>
        
        <form method="POST" action="">
            <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">
            
            <div class="form-group">
                <label for="email"><i class="fas fa-envelope"></i> Email Address</label>
                <input type="email" id="email" name="email" class="form-control" 
                       value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" 
                       required autofocus>
            </div>
            
            <div class="form-group">
                <label for="password"><i class="fas fa-lock"></i> Password</label>
                <input type="password" id="password" name="password" class="form-control" required>
            </div>
            
            <div class="checkbox-group">
                <input type="checkbox" id="remember" name="remember">
                <label for="remember">Remember me for 30 days</label>
            </div>
            
            <button type="submit" class="btn">
                <i class="fas fa-sign-in-alt"></i> Sign In
            </button>
        </form>
        
        <div class="twofa-link">
            <a href="setup-2fa.php"><i class="fas fa-shield-alt"></i> Setup Two-Factor Authentication</a>
        </div>
        
        <div class="register-link">
            Don't have an account? <a href="register.php">Create one here</a>
        </div>
    </div>
</body>
</html>