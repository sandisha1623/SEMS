<?php

namespace App\Models;

use CodeIgniter\Model;

class AuthSessionModel extends Model
{
    protected $table = 'auth_sessions';

    protected $allowedFields = [
        'user_id',
        'refresh_token',
        'device_name',
        'ip_address',
        'user_agent',
        'expires_at',
        'revoked_at',
    ];

    protected $useTimestamps = true;
}