<?php

namespace App\Database\Seeds;

use App\Libraries\Ulid;
use CodeIgniter\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        $keys = [
            'dashboard.view',
            'analytics.view',
            'analytics.export',
            'detection.view',
            'detection.validate',
            'detection.reject',
            'cctv.live',
            'cctv.replay',
            'report.generate',
            'report.download',
            'users.manage',
            'roles.manage',
            'settings.manage',
            'ai.manage',

            // Exam domain (Phase 1)
            'exam.manage',
            'exam.participate',
            'exam.monitor',
            'exam.review',

            // Face reference — granular permissions
            'face-reference.manage',     // admin: upload/approve/reject/archive
            'face-reference.upload-own', // student: upload foto sendiri
        ];

        $rows = array_map(static fn (string $key): array => [
            'public_id'      => Ulid::generateWithPrefix('prm'),
            'permission_key' => $key,
        ], $keys);

        $this->db->table('permissions')->insertBatch($rows);
    }
}