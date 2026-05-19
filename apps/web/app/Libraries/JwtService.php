<?php

namespace App\Libraries;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtService
{
    protected string $secret;
    protected string $algorithm;
    protected int $expiration;

    public function __construct()
    {
        $this->secret = env('jwt.secret');
        $this->algorithm = env('jwt.algorithm', 'HS256');
        $this->expiration = (int) env('jwt.expiration', 7200);
    }

    public function generate(array $user): string
    {
        $payload = [
            'uid' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role_slug'],
            'iat' => time(),
            'exp' => time() + $this->expiration,
        ];

        return JWT::encode(
            $payload,
            $this->secret,
            $this->algorithm
        );
    }

    public function verify(string $token)
    {
        return JWT::decode(
            $token,
            new Key(
                $this->secret,
                $this->algorithm
            )
        );
    }
}