<?php

namespace App\Core\Auth;

use App\Models\AuthSessionModel;

class RefreshTokenManager
{
    protected AuthSessionModel $model;

    public function __construct()
    {
        $this->model = new AuthSessionModel();
    }

    public function generate(): string
    {
        return bin2hex(random_bytes(64));
    }

    public function create(
        int $userId,
        string $token
    ): void {

        $request = service('request');

        $this->model->insert([
            'user_id'       => $userId,
            'refresh_token' => hash('sha256', $token),
            'device_name'   => $request->getUserAgent()->getBrowser(),
            'ip_address'    => $request->getIPAddress(),
            'user_agent'    => (string) $request->getUserAgent(),
            'expires_at'    => date(
                'Y-m-d H:i:s',
                strtotime('+30 days')
            ),
        ]);
    }

    public function validate(string $token): ?array
    {
        $session = $this->model
            ->where(
                'refresh_token',
                hash('sha256', $token)
            )
            ->where('revoked_at', null)
            ->first();

        if (! $session) {
            return null;
        }

        if (
            strtotime($session['expires_at']) < time()
        ) {
            return null;
        }

        return $session;
    }

    public function revoke(string $token): void
    {
        $this->model
            ->where(
                'refresh_token',
                hash('sha256', $token)
            )
            ->set([
                'revoked_at' => date('Y-m-d H:i:s')
            ])
            ->update();
    }
}