<?php

namespace App\Core\Logging;

use App\Models\ActivityLogModel;

class ActivityLogger
{
    protected ActivityLogModel $model;

    public function __construct()
    {
        $this->model = new ActivityLogModel();
    }

    public function log(
        string $event,
        ?string $description = null,
        array $properties = []
    ): void {
        $request = service('request');

        $this->model->insert([
            'user_id'     => service('auth')->id(),
            'event'       => $event,
            'description' => $description,
            'properties'  => json_encode(
                $properties,
                JSON_UNESCAPED_UNICODE
            ),
            'ip_address'  => $request->getIPAddress(),
        ]);
    }
}