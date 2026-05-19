<?php
namespace App\Services\Auth;

use App\Models\UserModel;
use App\Libraries\JwtService;

class AuthService
{
    protected JwtService $jwt;
    protected UserModel $users;

    public function __construct()
    {
        $this->jwt = new JwtService();
        $this->users = new UserModel();
    }

    public function login(string $username, string $password) {

        $user = $this->users
            ->select('users.*, roles.role_slug')
            ->join('roles', 'roles.id = users.role_id')
            ->where('users.username', $username)
            ->where('users.is_active', 1)
            ->first();

        if (! $user) {
            return false;
        }

        if (! password_verify(
            $password,
            $user['password_hash']
        )) {

            return false;
        }

        session()->regenerate(true);

        $token = $this->jwt->generate($user);

        session()->set([

            'logged_in' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role_slug'],
            ],

            'jwt' => $token,
        ]);

        //dd(session()->get());

        response()->setCookie([
            'name'     => 'sems_access_token',
            'value'    => $token,
            'expire'   => 86400,
            'httponly' => true,
            'secure'   => ENVIRONMENT !== 'development',
            'samesite' => 'Lax',
            'path'     => '/',
        ]);

        return [
            'user' => $user,
        ];
    }

    public function logout(): void
    {
        delete_cookie('sems_access_token');
        
        session()->destroy();
    }
}