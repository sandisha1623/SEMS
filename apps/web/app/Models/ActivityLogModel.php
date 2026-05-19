<?php

namespace App\Models;

use CodeIgniter\Model;

class ActivityLogModel extends Model
{
    protected $table = 'activity_logs';

    protected $allowedFields = [
        'user_id',
        'event',
        'description',
        'properties',
        'ip_address',
    ];
}