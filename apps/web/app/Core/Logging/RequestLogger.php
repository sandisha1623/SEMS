<?php

namespace App\Core\Logging;

class RequestLogger
{
    public function log(array $data): void
    {
        log_message(
            'info',
            json_encode([
                'type' => 'request',
                ...$data
            ])
        );
    }
}