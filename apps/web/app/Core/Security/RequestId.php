<?php

namespace App\Core\Security;

class RequestId
{
    protected string $requestId;

    public function __construct()
    {
        $this->requestId = $this->generate();
    }

    protected function generate(): string
    {
        return bin2hex(random_bytes(16));
    }

    public function get(): string
    {
        return $this->requestId;
    }
}