<?php

namespace App\Controllers\Auth;

use App\Controllers\BaseController;
use App\Services\Auth\AuthService;

class LoginController extends BaseController
{
    public function index()
    {
        if (session('logged_in')) {
            return redirect()->to('/dashboard');
        }

        return view('auth/login');
    }

    public function attempt()
    {
        $username = trim((string) $this->request->getVar('username'));
        $password = (string) $this->request->getVar('password');

        $service = new AuthService();

        $login = $service->login($username, $password);

        // CSRF hash baru selalu dikirim balik karena
        // Config\Security::$regenerate = true
        $csrf = [
            'name' => csrf_token(),
            'hash' => csrf_hash(),
        ];

        if (! $login) {
            return $this->response
                ->setStatusCode(401)
                ->setJSON([
                    'success' => false,
                    'message' => 'Invalid username or password',
                    'csrf'    => $csrf,
                ]);
        }

        return $this->response->setJSON([
            'success'  => true,
            'message'  => 'Login success',
            'redirect' => '/dashboard',
            'csrf'     => $csrf,
        ]);
    }

    public function logout()
    {
        $service = new AuthService();
        $service->logout();

        return redirect()->to('/login');
    }

    /**
     * Endpoint khusus untuk JS supaya bisa konek WebSocket ke FastAPI.
     *
     * Cookie sems_access_token bersifat httpOnly → JS tidak bisa baca.
     * JS panggil endpoint ini (auth via session+cookie), dapat JWT plain text,
     * lalu pasang sebagai query string saat membuka WebSocket.
     */
    public function wsToken()
    {
        if (! session('logged_in')) {
            return $this->response
                ->setStatusCode(401)
                ->setJSON([
                    'success' => false,
                    'message' => 'Not authenticated',
                ]);
        }

        $token = $this->request->getCookie('sems_access_token');

        if (! $token) {
            return $this->response
                ->setStatusCode(401)
                ->setJSON([
                    'success' => false,
                    'message' => 'No token',
                ]);
        }

        // Cek apakah token sudah di-blacklist (mis. setelah logout di tab lain)
        if (service('tokenBlacklist')->isBlacklisted($token)) {
            return $this->response
                ->setStatusCode(401)
                ->setJSON([
                    'success' => false,
                    'message' => 'Token revoked',
                ]);
        }

        return $this->response->setJSON([
            'success' => true,
            'token'   => $token,
            'ws_url'  => env('realtime.ws_url', 'ws://127.0.0.1:8001/ws'),
        ]);
    }
}