<?php

namespace App\Filters;

use App\Core\Security\SecurityHeaders;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class SecurityHeadersFilter implements FilterInterface
{
    public function before(
        RequestInterface $request,
        $arguments = null
    ) {
    }

    public function after(
        RequestInterface $request,
        ResponseInterface $response,
        $arguments = null
    ) {
        SecurityHeaders::apply($response);
    }
}