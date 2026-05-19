<?php

namespace App\Core\Exceptions;

use Exception;

class ApiException extends Exception
{
    protected array $errors = [];

    public function __construct(
        string $message = 'Error',
        int $code = 400,
        array $errors = []
    ) {
        parent::__construct($message, $code);

        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}