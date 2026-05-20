<?php

namespace App\Libraries;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

/**
 * JWT generator/parser dengan payload FLAT.
 *
 * Format payload (HARUS disamakan dengan FastAPI):
 *  {
 *    uid:       int,      ← internal id, untuk join DB
 *    public_id: string,   ← usr_<ULID>, untuk URL/logs/WS routing
 *    username:  string,
 *    email:     string,
 *    role:      string,
 *    iat:       int,
 *    exp:       int
 *  }
 */
class JwtService
{
    protected string $secret;
    protected string $algorithm;
    protected int    $expiration;

    public function __construct()
    {
        $this->secret     = env('jwt.secret');
        $this->algorithm  = env('jwt.algorithm', 'HS256');
        $this->expiration = (int) env('jwt.expiration', 7200);
    }

    public function generate(array $user): string
    {
        $payload = [
            'uid'       => $user['id'],
            'public_id' => $user['public_id'] ?? null,
            'username'  => $user['username'],
            'email'     => $user['email'],
            'role'      => $user['role_slug'] ?? ($user['role'] ?? null),
            'iat'       => time(),
            'exp'       => time() + $this->expiration,
        ];

        return JWT::encode($payload, $this->secret, $this->algorithm);
    }

    public function parse(string $token): ?array
    {
        try {
            $decoded = JWT::decode(
                trim($token),
                new Key($this->secret, $this->algorithm)
            );

            return (array) $decoded;
        } catch (Throwable $e) {
            log_message('debug', 'JWT parse failed: ' . $e->getMessage());
            return null;
        }
    }

    public function getTtl(string $token): int
    {
        try {
            $decoded = JWT::decode(
                trim($token),
                new Key($this->secret, $this->algorithm)
            );

            return max(1, $decoded->exp - time());
        } catch (Throwable $e) {
            log_message('error', 'JWT TTL failed: ' . $e->getMessage());
            return 0;
        }
    }

    public function verify(string $token)
    {
        return JWT::decode(
            trim($token),
            new Key($this->secret, $this->algorithm)
        );
    }
}