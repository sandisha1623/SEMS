<?php

namespace App\Core\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JWTManager
{
    protected string $secret;
    protected int $expire;

    public function __construct()
    {
        $this->secret = env('jwt.secret');
        $this->expire = (int) env('jwt.expiration', 3600);
    }

    public function generate(array $user): string
    {
        $now = time();

        $payload = [
            'iss' => base_url(),
            'iat' => $now,
            'exp' => $now + $this->expire,

            'data' => [
                'id'          => $user['id'],
                'name'        => $user['name'],
                'role'        => $user['role'],
                'permissions' => $user['permissions'] ?? [],
            ]
        ];

        return JWT::encode(
            $payload,
            $this->secret,
            'HS256'
        );
    }

    public function parse(string $token): ?array
    {
        try {

            $decoded = JWT::decode(
                $token,
                new Key($this->secret, 'HS256')
            );

            return (array) $decoded->data;

        } catch (Exception $e) {

            return null;
        }
    }

    public function getTtl(
        string $token
    ): int {

        try {

            $decoded = JWT::decode(
                trim($token),
                new Key(
                    $this->secret,
                    'HS256'
                )
            );

            return max(
                1,
                $decoded->exp - time()
            );

        } catch (\Throwable $e) {

            log_message(
                'error',
                $e->getMessage()
            );

            return 3600;
        }
    }
}