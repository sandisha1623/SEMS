<?php

namespace App\Filters;

use App\Core\Response\ApiStatus;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class RoleFilter implements FilterInterface
{
    public function before(
        RequestInterface $request,
        $arguments = null
    ) {
        helper('api');
        
        $auth = service('auth');

        if (! $auth->check()) {
            return api_error(
                'Unauthorized',
                [],
                ApiStatus::UNAUTHORIZED
            );
        }

        if (! $auth->hasRole($arguments ?? [])) {
            return api_error(
                'Forbidden',
                [],
                ApiStatus::FORBIDDEN
            );
        }
    }

    public function after(
        RequestInterface $request,
        ResponseInterface $response,
        $arguments = null
    ) {
    }
}