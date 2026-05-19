<?php

namespace App\Core\Exceptions;

use Throwable;

class ApiExceptionHandler
{
    public static function render(Throwable $e): array
    {
        $code = $e->getCode();

        if ($code < 100 || $code > 599) {
            $code = 500;
        }

        return [
            'success' => false,
            'code'    => $code,
            'message' => ENVIRONMENT === 'production'
                ? 'Internal Server Error'
                : $e->getMessage(),
            'errors'  => method_exists($e, 'getErrors')
                ? $e->getErrors()
                : [],
            'meta' => [
                'request_id' => service('requestId')->get(),
                'timestamp'  => date(DATE_ATOM),
            ]
        ];
    }
}