<?php

namespace Config;

use CodeIgniter\Config\BaseService;

/**
 * Services Configuration file.
 *
 * Services are simply other classes/libraries that the system uses
 * to do its job. This is used by CodeIgniter to allow the core of the
 * framework to be swapped out easily without affecting the usage within
 * the rest of your application.
 *
 * This file holds any application-specific services, or service overrides
 * that you might need. An example has been included with the general
 * method format you should use for your service methods. For more examples,
 * see the core Services file at system/Config/Services.php.
 */
class Services extends BaseService
{
    /*
     * public static function example($getShared = true)
     * {
     *     if ($getShared) {
     *         return static::getSharedInstance('example');
     *     }
     *
     *     return new \CodeIgniter\Example();
     * }
     */

    public static function jwt(bool $getShared = true)
    {
        if ($getShared) {
            return static::getSharedInstance('jwt');
        }

        return new \App\Core\Auth\JWTManager();
    }

    public static function refreshToken(bool $getShared = true)
    {
        if ($getShared) {
            return static::getSharedInstance('refreshToken');
        }

        return new \App\Core\Auth\RefreshTokenManager();
    }

    public static function deviceSession(bool $getShared = true)
    {
        if ($getShared) {
            return static::getSharedInstance('deviceSession');
        }

        return new \App\Core\Auth\DeviceSessionManager();
    }

    public static function tokenBlacklist(bool $getShared = true)
    {
        if ($getShared) {
            return static::getSharedInstance(
                'tokenBlacklist'
            );
        }

        return new \App\Core\Auth\TokenBlacklist();
    }

    public static function auth(bool $getShared = true)
    {
        if ($getShared) {
            return static::getSharedInstance('auth');
        }

        return new \App\Core\Auth\AuthManager();
    }

    public static function rateLimiter(bool $getShared = true)
    {
        if ($getShared) {
            return static::getSharedInstance('rateLimiter');
        }

        return new \App\Core\Security\RateLimiter();
    }

    public static function loginRateLimiter(bool $getShared = true)
    {
        if ($getShared) {
            return static::getSharedInstance('loginRateLimiter');
        }

        return new \App\Core\Security\LoginRateLimiter();
    }

    public static function requestId(bool $getShared = true)
    {
        if ($getShared) {
            return static::getSharedInstance('requestId');
        }

        return new \App\Core\Security\RequestId();
    }

    public static function requestLogger(bool $getShared = true)
    {
        if ($getShared) {
            return static::getSharedInstance('requestLogger');
        }

        return new \App\Core\Logging\RequestLogger();
    }

    public static function activityLogger(bool $getShared = true)
    {
        if ($getShared) {
            return static::getSharedInstance('activityLogger');
        }

        return new \App\Core\Logging\ActivityLogger();
    }
}
