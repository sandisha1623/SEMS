<?php

namespace App\Filters;

use App\Core\Response\ApiStatus;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class ThrottleFilter implements FilterInterface
{
    public function before(
        RequestInterface $request,
        $arguments = null
    ) {

        helper('api');

        $maxAttempts = (int) ($arguments[0] ?? 60);
        $decay       = (int) ($arguments[1] ?? 60);

        $key = sprintf(
            'throttle_%s_%s',
            md5($request->getIPAddress()),
            md5(uri_string())
        );

        $allowed = service('rateLimiter')->attempt(
            $key,
            $maxAttempts,
            $decay
        );

        if (! $allowed) {

            return api_error(
                'Too many requests',
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