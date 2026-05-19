<?php

namespace App\Core\Auth;

use App\Models\AuthSessionModel;

class DeviceSessionManager
{
    protected AuthSessionModel $model;

    public function __construct()
    {
        $this->model = new AuthSessionModel();
    }

    public function sessionsByUser(
        int $userId
    ): array {

        return $this->model
            ->where('user_id', $userId)
            ->where('revoked_at', null)
            ->findAll();
    }

    public function revokeSession(
        int $sessionId,
        int $userId
    ): bool {

        return $this->model
            ->where('id', $sessionId)
            ->where('user_id', $userId)
            ->set([
                'revoked_at' => date('Y-m-d H:i:s')
            ])
            ->update();
    }

    public function revokeAll(
        int $userId
    ): bool {

        return $this->model
            ->where('user_id', $userId)
            ->where('revoked_at', null)
            ->set([
                'revoked_at' => date('Y-m-d H:i:s')
            ])
            ->update();
    }
}