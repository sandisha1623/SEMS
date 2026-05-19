<?php

namespace App\Core\Security;

class SecurityHeaders
{
    public static function apply($response)
    {
        return $response
            ->setHeader('X-Frame-Options', 'SAMEORIGIN')
            ->setHeader('X-Content-Type-Options', 'nosniff')
            ->setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->setHeader('X-XSS-Protection', '1; mode=block')
            ->setHeader(
                'Content-Security-Policy',
                "default-src * 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss:;"
            );
    }
}