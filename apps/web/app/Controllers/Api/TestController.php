<?php

namespace App\Controllers\Api;

use App\Core\Response\ApiStatus;

class TestController extends BaseApiController
{
    public function public()
    {
        return $this->successResponse(
            ['access' => 'public'],
            'Public route',
            ApiStatus::OK
        );
    }

    public function protected()
    {
        return $this->successResponse(
            ['access' => 'protected'],
            'Authenticated route',
            ApiStatus::OK
        );
    }

    public function jwtToken()
    {
        $user = [
            'id' => 1,
            'name' => 'Super Admin',
            'role' => 'super-admin',
            'permissions' => [
                'resident.create'
            ]
        ];

        $token = service('jwt')->generate($user);

        return $this->successResponse([
            'token' => $token
        ]);
    }

    public function jwtProtected()
    {
        return $this->successResponse([
            'user' => service('request')->user
        ]);
    }

    public function jwtLogin()
    {
        $user = [
            'id' => 1,
            'name' => 'Super Admin',
            'role' => 'super-admin',
        ];

        $accessToken = service('jwt')
            ->generate($user);

        $refreshToken = service('refreshToken')
            ->generate();

        service('refreshToken')->create(
            $user['id'],
            $refreshToken
        );

        return $this->successResponse([
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
        ]);
    }

    public function jwtLogout()
    {
        $header = $this->request
            ->getHeaderLine('Authorization');

        if (! str_starts_with(
            $header,
            'Bearer '
        )) {

            return $this->errorResponse(
                'Unauthorized',
                [],
                401
            );
        }

        $token = trim(substr($header, 7));

        $ttl = service('jwt')
            ->getTtl($token);

        log_message(
            'debug',
            'JWT TTL: ' . $ttl
        );

        service('tokenBlacklist')
            ->blacklist($token, $ttl);

        return $this->successResponse(
            [],
            'Logout success'
        );
    }

    public function publishEvent()
    {
        $redis = new \Redis();

        $redis->connect(
            env('redis.host', '127.0.0.1'),
            (int) env('redis.port', 6379)
        );

        $payload = [
            'type' => 'notification',
            'title' => 'Realtime Event',
            'message' => 'Hello from CI4',
            'time' => date('H:i:s')
        ];

        $redis->publish(
            'sems_events',
            json_encode($payload)
        );

        return $this->successResponse(
            $payload,
            'Event published'
        );
    }

    public function notifyUser()
    {
        $userId = $this->request->getPost(
            'user_id'
        );

        $redis = new \Redis();

        $redis->connect(
            env('redis.host', '127.0.0.1'),
            (int) env('redis.port', 6379)
        );

        $payload = [
            'type' => 'notification',
            'user_id' => $userId,
            'title' => 'Personal Notification',
            'message' => 'Hello User #' . $userId,
            'time' => date('H:i:s')
        ];

        $redis->publish(
            'sems_events',
            json_encode($payload)
        );

        return $this->successResponse(
            $payload,
            'Notification sent'
        );
    }

    public function onlineUsers()
    {
        $redis = new \Redis();
        $redis->connect('127.0.0.1', 6379);

        $iterator = null;
        $users = [];

        while ($keys = $redis->scan($iterator, 'presence:*', 100)) {

            foreach ($keys as $key) {

                $userId = str_replace('presence:', '', $key);
                $users[$userId] = 'online';
            }
        }

        return $this->successResponse(
            $users,
            'Online users'
        );
    }

    public function notify()
    {
        $service = new \App\Services\NotificationService();

        $service->send(
            1,
            'payment',
            'Pembayaran Baru',
            'Ada pembayaran baru masuk'
        );

        return $this->successResponse(
            [],
            'Notification sent'
        );
    }

    public function refreshToken()
    {
        $refreshToken = $this->request
        ->getJSON(true)['refresh_token']
            ?? $this->request->getPost('refresh_token');

        if (! $refreshToken) {

            return $this->errorResponse(
                'Refresh token required'
            );
        }

        $session = service('refreshToken')
            ->validate($refreshToken);

        if (! $session) {

            return $this->errorResponse(
                'Invalid refresh token',
                [],
                401
            );
        }

        /*
        |--------------------------------------------------------------------------
        | ROTATE TOKEN
        |--------------------------------------------------------------------------
        */

        service('refreshToken')
            ->revoke($refreshToken);

        /*
        |--------------------------------------------------------------------------
        | LOAD USER
        |--------------------------------------------------------------------------
        |
        | nanti real query user database
        |
        */

        $user = [
            'id' => $session['user_id'],
            'name' => 'Super Admin',
            'role' => 'super-admin',
        ];

        /*
        |--------------------------------------------------------------------------
        | ISSUE NEW TOKENS
        |--------------------------------------------------------------------------
        */

        $newAccessToken = service('jwt')
            ->generate($user);

        $newRefreshToken = service('refreshToken')
            ->generate();

        service('refreshToken')->create(
            $user['id'],
            $newRefreshToken
        );

        return $this->successResponse([
            'access_token'  => $newAccessToken,
            'refresh_token' => $newRefreshToken,
        ]);
    }

    public function activityTest()
    {
        activity(
            'user.login',
            'User login success',
            [
                'email' => 'admin@sems.test'
            ]
        );

        return $this->successResponse(
            [],
            'Activity logged'
        );
    }

    public function redisTest()
    {
        $saved = cache()->save(
            'sems_test',
            'Redis Working',
            60
        );

        return $this->successResponse([
            'saved' => $saved,
            'value' => cache()->get('sems_test')
        ]);
    }

    public function redisPing()
    {
        try {

            $redis = new \Redis();

            $redis->connect('127.0.0.1', 6379);

            return $this->successResponse([
                'ping' => $redis->ping()
            ]);

        } catch (\Throwable $e) {

            return $this->errorResponse(
                $e->getMessage()
            );
        }
    }

    public function exceptionTest()
    {
        throw new \Exception(
            'Test exception',
            500
        );
    }

    public function admin()
    {
        return $this->successResponse(
            ['access' => 'admin'],
            'Admin route',
            ApiStatus::OK
        );
    }

    public function payment()
    {
        return $this->successResponse(
            ['access' => 'payment'],
            'Permission route',
            ApiStatus::OK
        );
    }

    public function loginAsAdmin()
    {
        session()->set('user', [
            'id' => 1,
            'name' => 'Super Admin',
            'role' => 'super-admin',
            'permissions' => [
                'finance.payment.verify',
                'resident.create',
            ]
        ]);

        return $this->successResponse(
            session('user'),
            'Login as admin success'
        );
    }

    public function loginAsUser()
    {
        session()->set('user', [
            'id' => 2,
            'name' => 'Regular User',
            'role' => 'user',
            'permissions' => [
                'resident.create',
            ]
        ]);

        return $this->successResponse(
            session('user'),
            'Login as user success'
        );
    }

    public function logout()
    {
        session()->remove('user');

        return $this->successResponse(
            [],
            'Logout success'
        );
    }
}