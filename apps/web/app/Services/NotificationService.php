<?php

namespace App\Services;

class NotificationService
{
    public function send(
        int $userId,
        string $type,
        string $title,
        string $message
    ) {

        $db = db_connect();

        $db->table('notifications')
            ->insert([
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
            ]);

        $redis = new \Redis();

        $redis->connect(
            env('redis.host', '127.0.0.1'),
            (int) env('redis.port', 6379)
        );

        $event = [
            'type' => 'notification',
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
        ];

        $redis->publish(
            'sems_events',
            json_encode($event)
        );
    }
}