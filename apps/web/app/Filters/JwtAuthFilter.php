<?php

namespace App\Filters;

use App\Core\Response\ApiStatus;
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

        $token = $request->getCookie('sems_access_token');

        if (! $token) {

            return api_error(
                'Unauthorized',
                [],
                ApiStatus::UNAUTHORIZED
            );
        }

        if (service('tokenBlacklist')->isBlacklisted($token)) 
        {
            return api_error(
                'Token revoked',
                [],
                ApiStatus::UNAUTHORIZED
            );
        }

        $user = service('jwt')->parse($token);

        if (! $user) {

            return api_error(
                'Invalid token',
                [],
                ApiStatus::UNAUTHORIZED
            );
        }

        service('request')->user = $user;
    }

    public function after(
        RequestInterface $request,
        ResponseInterface $response,
        $arguments = null
    ) {
    }
}