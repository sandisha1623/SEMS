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
        $username = trim((string) $this->request->getPost('username'));
        $password = (string) $this->request->getPost('password');

        $service = new AuthService();

        $login = $service->login(
            $username,
            $password
        );

        if (! $login) {

            return $this->response
                ->setStatusCode(401)
                ->setJSON([
                    'success' => false,
                    'message' => 'Invalid username or password'
                ]);
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Login success',
            'redirect' => '/dashboard'
        ]);
    }

    public function logout()
    {
        $service = new AuthService();
        $service->logout();

        return redirect()->to('/login');
    }
}