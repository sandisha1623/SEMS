<?php
namespace App\Services\Auth;

use App\Models\UserModel;
use App\Libraries\JwtService;

class AuthService
{
    protected JwtService $jwt;
    protected UserModel  $users;

    public const COOKIE_NAME = 'sems_access_token';

    public function __construct()
    {
        $this->jwt   = new JwtService();
        $this->users = new UserModel();
    }

    public function login(string $username, string $password)
    {
        $user = $this->users
            ->select('users.id, users.public_id, users.username, users.email, users.password_hash, users.is_active, users.role_id, roles.role_slug')
            ->join('roles', 'roles.id = users.role_id')
            ->where('users.username', $username)
            ->where('users.is_active', 1)
            ->first();

        if (! $user) {
            return false;
        }

        if (! password_verify($password, $user['password_hash'])) {
            return false;
        }

        session()->regenerate(true);

        $token = $this->jwt->generate($user);

        session()->set([
            'logged_in' => true,
            'user' => [
                'id'        => $user['id'],
                'public_id' => $user['public_id'],
                'username'  => $user['username'],
                'email'     => $user['email'],
                'role'      => $user['role_slug'],
            ],
        ]);

        $this->setAuthCookie(
            $token,
            (int) env('jwt.expiration', 7200)
        );

        return ['user' => $user];
    }

    public function logout(): void
    {
        // Blacklist token aktif — ini lapisan keamanan utama,
        // lebih penting dari menghapus cookie di browser.
        $token = service('request')->getCookie(self::COOKIE_NAME);

        if ($token) {
            $ttl = $this->jwt->getTtl($token);

            // Hanya blacklist kalau TTL masih positif — token expired
            // sudah otomatis invalid, tidak perlu masuk blacklist.
            if ($ttl > 0) {
                service('tokenBlacklist')->blacklist($token, $ttl);
            }
        }

        // Overwrite cookie dengan nilai kosong + expire di masa lalu.
        // Atribut HARUS identik dengan saat set, kalau tidak browser
        // menganggap ini cookie berbeda dan cookie lama tetap ada.
        $this->setAuthCookie('', -1);

        session()->destroy();
    }

    /**
     * Set/replace cookie auth dengan atribut konsisten.
     */
    protected function setAuthCookie(string $value, int $expireSeconds): void
    {
        $appConfig = config('App');

        response()->setCookie([
            'name'     => self::COOKIE_NAME,
            'value'    => $value,
            'expire'   => $expireSeconds,
            'domain'   => $appConfig->cookieDomain ?: '',
            'path'     => '/',
            'httponly' => true,
            'secure'   => $appConfig->cookieSecure,
            'samesite' => $appConfig->cookieSameSite ?: 'Lax',
        ]);
    }
}