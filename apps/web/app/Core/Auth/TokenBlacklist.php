<?php

namespace App\Core\Auth;

use Redis;

class TokenBlacklist
{
    protected string $prefix =
        'jwt_blacklist_';

    protected Redis $redis;

    public function __construct()
    {
        $this->redis = new Redis();

        $this->redis->connect(
            env('redis.host', '127.0.0.1'),
            (int) env('redis.port', 6379)
        );
    }

    public function blacklist(
        string $token,
        int $ttl
    ): bool {

        $key = $this->prefix . md5($token);

        log_message(
            'debug',
            'BLACKLIST KEY: ' . $key
        );

        return $this->redis->setex(
            $key,
            $ttl,
            '1'
        );
    }

    public function isBlacklisted(
        string $token
    ): bool {

        $key = $this->prefix . md5($token);

        return (bool) $this->redis->exists(
            $key
        );
    }
}