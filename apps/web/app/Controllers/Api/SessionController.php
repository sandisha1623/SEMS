<?php

namespace App\Controllers\Api;

use App\Controllers\Api\BaseApiController;

class SessionController extends BaseApiController
{
    public function index()
    {
        $user = service('request')->user;

        $sessions = service('deviceSession')
            ->sessionsByUser($user['id']);

        return $this->successResponse([
            'sessions' => $sessions
        ]);
    }

    public function revoke($id)
    {
        $user = service('request')->user;

        service('deviceSession')->revokeSession(
            (int) $id,
            $user['id']
        );

        return $this->successResponse(
            [],
            'Session revoked'
        );
    }

    public function revokeAll()
    {
        $user = service('request')->user;

        service('deviceSession')
            ->revokeAll($user['id']);

        return $this->successResponse(
            [],
            'All sessions revoked'
        );
    }
}