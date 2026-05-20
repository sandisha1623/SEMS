<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');
$routes->get('dashboard', 'DashboardController::index');
 
$routes->group('', static function ($routes) {
    $routes->get('/login',  'Auth\\LoginController::index');
    $routes->post('/login', 'Auth\\LoginController::attempt');
    $routes->get('/logout', 'Auth\\LoginController::logout');
 
    // Endpoint untuk JS ambil JWT (dipakai untuk WebSocket).
    // Auth pakai session — login dulu, baru bisa akses.
    $routes->get('/auth/ws-token', 'Auth\\LoginController::wsToken');
});

/*
 * Generate Password
 *
 */
 $routes->get('/hash', function () {
    return password_hash(
        'Admin123!',
        PASSWORD_ARGON2ID
    );
});

$routes->group('api', static function ($routes) {

    // TEST
    $routes->get('api/test', 'Api\TestController::index');
    $routes->get('api/activity-test', 'Api\TestController::activityTest');

    // PUBLIC
    $routes->get('public', 'Api\TestController::public');

    // LOGIN TEST
    $routes->get('login-admin', 'Api\TestController::loginAsAdmin');
    $routes->get('login-user', 'Api\TestController::loginAsUser');
    $routes->get('logout', 'Api\TestController::logout');

    $routes->get('jwt-token', 'Api\TestController::jwtToken');

    $routes->get(
        'jwt-protected',
        'Api\TestController::jwtProtected',
        [
            'filter' => 'jwt'
        ]
    );

    $routes->post(
        'publish-event',
        'Api\TestController::publishEvent'
    );

    $routes->get('jwt-login', 'Api\TestController::jwtLogin');
    $routes->post(
        'jwt-logout',
        'Api\TestController::jwtLogout',
        [
            'filter' => 'jwt'
        ]
    );

    $routes->post('refresh-token', 'Api\TestController::refreshToken');

    // AUTH
    $routes->get(
        'protected',
        'Api\TestController::protected',
        ['filter' => 'auth']
    );

    // ROLE
    $routes->get(
        'admin',
        'Api\TestController::admin',
        ['filter' => 'role:super-admin,admin']
    );

    // PERMISSION
    $routes->get(
        'payment',
        'Api\TestController::payment',
        ['filter' => 'permission:finance.payment.verify']
    );

    $routes->get(
        'throttle-test',
        'Api\TestController::public',
        [
            'filter' => 'throttle:5,60'
        ]
    );

    $routes->get('exception-test', 'Api\TestController::exceptionTest');

    // REDIS
    $routes->get('redis-test', 'Api\TestController::redisTest');
    $routes->get(
        'redis-ping',
        'Api\TestController::redisPing'
    );

    $routes->post('notify-user', 'Api\TestController::notifyUser');
    $routes->get('online-users', 'Api\TestController::onlineUsers');
    $routes->get('notify-test', 'Api\TestController::notify');
});

$routes->group('api/sessions', ['filter' => 'jwt'], static function ($routes) {

    $routes->get(
        '/',
        'Api\SessionController::index'
    );

    $routes->delete(
        '(:num)',
        'Api\SessionController::revoke/$1'
    );

    $routes->delete(
        '/',
        'Api\SessionController::revokeAll'
    );
});