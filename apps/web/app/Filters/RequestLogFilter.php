<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class RequestLogFilter implements FilterInterface
{
    protected float $startTime;

    public function before(
        RequestInterface $request,
        $arguments = null
    ) {
        $this->startTime = microtime(true);
    }

    public function after(
        RequestInterface $request,
        ResponseInterface $response,
        $arguments = null
    ) {
        $duration = round(
            (microtime(true) - $this->startTime) * 1000,
            2
        );

        service('requestLogger')->log([
            'request_id' => service('requestId')->get(),
            'method'     => $request->getMethod(),
            'url'        => current_url(),
            'status'     => $response->getStatusCode(),
            'duration'   => $duration . ' ms',
            'ip'         => $request->getIPAddress(),
            'user_id'    => service('auth')->id(),
        ]);
    }
}