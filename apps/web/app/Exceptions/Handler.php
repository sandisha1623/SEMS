<?php

namespace App\Exceptions;

use App\Core\Exceptions\ApiExceptionHandler;
use CodeIgniter\Debug\BaseExceptionHandler;
use CodeIgniter\Debug\ExceptionHandlerInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class Handler extends BaseExceptionHandler implements ExceptionHandlerInterface
{
    public function handle(
        Throwable $exception,
        RequestInterface $request,
        ResponseInterface $response,
        int $statusCode,
        int $exitCode
    ): void {

        if (
            $request->isAJAX() ||
            str_contains(current_url(), '/api/')
        ) {

            $response
                ->setStatusCode($statusCode)
                ->setJSON(
                    ApiExceptionHandler::render($exception)
                )
                ->send();

            exit($exitCode);
        }
    }
}