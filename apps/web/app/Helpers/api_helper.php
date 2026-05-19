<?php

use App\Core\Response\ApiStatus;

if (! function_exists('api_success')) {

    function api_success(
        mixed $data = null,
        string $message = 'Success',
        int $code = ApiStatus::OK
    ) {
        return service('response')
            ->setStatusCode($code)
            ->setJSON([
                'success' => true,
                'code'    => $code,
                'message' => $message,
                'data'    => $data,
                'meta'    => [
                    'request_id' => service('requestId')->get(),
                    'timestamp'  => date(DATE_ATOM),
                ],
            ]);
    }
}

if (! function_exists('api_error')) {

    function api_error(
        string $message = 'Error',
        array $errors = [],
        int $code = ApiStatus::BAD_REQUEST
    ) {
        return service('response')
            ->setStatusCode($code)
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

if (! function_exists('activity')) {

    function activity(
        string $event,
        ?string $description = null,
        array $properties = []
    ): void {
        service('activityLogger')->log(
            $event,
            $description,
            $properties
        );
    }
}