<?php

namespace App\Filters;

use App\Core\Response\ApiStatus;
use App\Libraries\JwtService;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class JwtAuthFilter implements FilterInterface
{
    public function before(
        RequestInterface $request,
        $arguments = null
    ) {
        helper('api');

        // 1) Ambil token dari cookie (set saat login) ATAU header Authorization
        $token = $request->getCookie('sems_access_token');

        if (! $token) {
            $auth = $request->getHeaderLine('Authorization');
            if (str_starts_with($auth, 'Bearer ')) {
                $token = trim(substr($auth, 7));
            }
        }

        if (! $token) {
            return api_error(
                'Unauthorized',
                [],
                ApiStatus::UNAUTHORIZED
            );
        }

        // 2) Cek blacklist (Redis)
        if (service('tokenBlacklist')->isBlacklisted($token)) {
            return api_error(
                'Token revoked',
                [],
                ApiStatus::UNAUTHORIZED
            );
        }

        // 3) Parse JWT — pakai JwtService (FLAT payload, sama dengan FastAPI)
        $jwt     = new JwtService();
        $payload = $jwt->parse($token);

        if (! $payload) {
            return api_error(
                'Invalid token',
                [],
                ApiStatus::UNAUTHORIZED
            );
        }

        // Inject ke request supaya kontroler bisa baca service('request')->user
        service('request')->user = $payload;
    }

    public function after(
        RequestInterface $request,
        ResponseInterface $response,
        $arguments = null
    ) {
    }
}