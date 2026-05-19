<?php

namespace App\Core\Security;

use Config\Services;

class RateLimiter
{
    protected $cache;

    public function __construct()
    {
        $this->cache = cache();
    }

    public function attempt(
        string $key,
        int $maxAttempts = 60,
        int $decaySeconds = 60
    ): bool {

        $attempts = (int) $this->cache->get($key);

        if ($attempts >= $maxAttempts) {
            return false;
        }

        $attempts++;

        $this->cache->save(
            $key,
            $attempts,
            $decaySeconds
        );

        return true;
    }

    public function remaining(
        string $key,
        int $maxAttempts
    ): int {

        $attempts = (int) $this->cache->get($key);

        return max(0, $maxAttempts - $attempts);
    }
}