<?php
class TwoFA {
    private $tfa;
    private $issuer = 'CyberGuard';
    
    public function __construct() {
        $this->tfa = new RobThree\Auth\TwoFactorAuth($this->issuer);
    }
    
    // Generate new secret for a user
    public function generateSecret() {
        return $this->tfa->createSecret();
    }
    
    // Generate QR code URL for Google Authenticator
    public function getQRCodeImage($email, $secret) {
        return $this->tfa->getQRCodeImageAsDataUri($email, $secret);
    }
    
    // Verify the 2FA code
    public function verifyCode($secret, $code) {
        return $this->tfa->verifyCode($secret, $code, TWOFA_WINDOW);
    }
    
    // Generate backup codes
    public function generateBackupCodes($count = 10) {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(5))); // 10-character codes
        }
        return $codes;
    }
    
    // Hash backup codes for storage
    public function hashBackupCodes($codes) {
        $hashed = [];
        foreach ($codes as $code) {
            $hashed[] = password_hash($code, PASSWORD_BCRYPT);
        }
        return json_encode($hashed);
    }
    
    // Verify backup code
    public function verifyBackupCode($inputCode, $storedHashes) {
        $hashes = json_decode($storedHashes, true);
        foreach ($hashes as $hash) {
            if (password_verify($inputCode, $hash)) {
                return true;
            }
        }
        return false;
    }
    
    // Remove used backup code
    public function removeBackupCode($usedCode, $storedHashes) {
        $hashes = json_decode($storedHashes, true);
        $newHashes = [];
        
        foreach ($hashes as $hash) {
            if (!password_verify($usedCode, $hash)) {
                $newHashes[] = $hash;
            }
        }
        
        return json_encode($newHashes);
    }
}
?>