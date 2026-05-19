<?php

namespace App\Core\Response;

trait ApiResponse
{
    protected function successResponse(
        mixed $data = null,
        string $message = 'Success',
        int $code = 200,
        array $meta = []
    ) {
        return $this->response->setStatusCode($code)
            ->setJSON([
                'success' => true,
                'code'    => $code,
                'message' => $message,
                'data'    => $data,
                'meta'    => array_merge([
                    'request_id' => service('requestId')->get(),
                    'timestamp'  => date(DATE_ATOM),
                ], $meta),
            ]);
    }

    protected function errorResponse(
        string $message = 'Error',
        array $errors = [],
        int $code = 400
    ) {
        return $this->response->setStatusCode($code)
            ->setJSON([
                'success' => false,
                'code'    => $code,
                'message' => $message,
                'errors'  => $errors,
                'meta'    => [
                    'request_id' => service('requestId')->get(),
                    'timestamp'  => date(DATE_ATOM),
                ],
            ]);
    }
}