<?php

namespace App\Filters;

use App\Core\Response\ApiStatus;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class LoginThrottleFilter implements FilterInterface
{
    public function before(
        RequestInterface $request,
        $arguments = null
    ) {

        helper('api');

        $allowed = service('loginRateLimiter')
            ->check($request->getIPAddress());

        if (! $allowed) {

            return api_error(
                'Too many login attempts',
                [],
                ApiStatus::TOO_MANY_REQUESTS
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