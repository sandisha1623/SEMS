<?php

namespace App\Filters;

use App\Core\Response\ApiStatus;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class AuthFilter implements FilterInterface
{
    public function before(
        RequestInterface $request,
        $arguments = null
    ) {
        helper('api');
        
        if (! service('auth')->check()) {

            return api_error(
                'Unauthorized',
                [],
                ApiStatus::UNAUTHORIZED
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