<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

// ==========================================================
// WEB ROUTES
// ==========================================================

// Public routes (tidak butuh login)
$routes->get('/', 'Home::index');
$routes->get('/login',  'Auth\\LoginController::index');
$routes->post('/login', 'Auth\\LoginController::attempt');

// Protected web routes (butuh login)
$routes->group('', ['filter' => 'web-auth'], static function ($routes) {
    $routes->get('dashboard', 'DashboardController::index');
    $routes->get('/logout',   'Auth\\LoginController::logout');
    $routes->get('/auth/token', 'Auth\\LoginController::token');
});

// Exam Sessions — butuh permission exam.manage
$routes->group(
    'exam-sessions',
    ['filter' => 'web-permission:exam.manage'],
    static function ($routes) {
        $routes->get('/',                'ExamSessionController::index');
        $routes->get('create',           'ExamSessionController::create');
        $routes->post('store',           'ExamSessionController::store');
        $routes->get('(:any)/edit',      'ExamSessionController::edit/$1');
        $routes->post('(:any)/update',   'ExamSessionController::update/$1');
        $routes->post('(:any)/delete',   'ExamSessionController::delete/$1');
    }
);

// Departments (master data) — butuh permission settings.manage
$routes->group(
    'departments',
    ['filter' => 'web-permission:settings.manage'],
    static function ($routes) {
        $routes->get('/',                'DepartmentController::index');
        $routes->get('create',           'DepartmentController::create');
        $routes->post('store',           'DepartmentController::store');
        $routes->get('(:any)/edit',      'DepartmentController::edit/$1');
        $routes->post('(:any)/update',   'DepartmentController::update/$1');
        $routes->post('(:any)/delete',   'DepartmentController::delete/$1');
    }
);

/*
 * Generate Password
 *
 $routes->get('/hash', function () {
    return password_hash(
        'Admin123!',
        PASSWORD_ARGON2ID
    );
});*/

// ==========================================================
// API ROUTES
// ==========================================================

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
        ['filter' => 'jwt']
    );

    $routes->post('publish-event', 'Api\TestController::publishEvent');

    $routes->get('jwt-login', 'Api\TestController::jwtLogin');
    $routes->post(
        'jwt-logout',
        'Api\TestController::jwtLogout',
        ['filter' => 'jwt']
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
        ['filter' => 'throttle:5,60']
    );

    $routes->get('exception-test', 'Api\TestController::exceptionTest');

    // REDIS
    $routes->get('redis-test', 'Api\TestController::redisTest');
    $routes->get('redis-ping', 'Api\TestController::redisPing');

    $routes->post('notify-user', 'Api\TestController::notifyUser');
    $routes->get('online-users', 'Api\TestController::onlineUsers');
    $routes->get('notify-test', 'Api\TestController::notify');

    // Exam Sessions API — DataTables server-side data source
    $routes->get(
        'exam-sessions/data',
        'Api\ExamSessionApiController::data',
        ['filter' => 'web-permission:exam.manage']
    );

    // Departments API — DataTables server-side data source
    $routes->get(
        'departments/data',
        'Api\DepartmentApiController::data',
        ['filter' => 'web-permission:settings.manage']
    );
});

$routes->group('api/sessions', ['filter' => 'jwt'], static function ($routes) {

    $routes->get('/',           'Api\SessionController::index');
    $routes->delete('(:num)',   'Api\SessionController::revoke/$1');
    $routes->delete('/',        'Api\SessionController::revokeAll');
});