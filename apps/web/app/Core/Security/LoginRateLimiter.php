<?php

namespace App\Core\Security;

class LoginRateLimiter extends RateLimiter
{
    public function check(string $ip): bool
    {
        return $this->attempt(
            'login:' . $ip,
            5,
            300
        );
    }
}