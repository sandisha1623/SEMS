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

            // Permissions untuk exam domain (Phase 1 SEMS)
            'exam.manage',       // CRUD exam sessions (admin)
            'exam.participate',  // Ikut ujian (mahasiswa)
            'exam.monitor',      // Awasi ujian live (pengawas)
            'exam.review',       // Review violation & evidence
        ];

        $rows = array_map(static fn (string $key): array => [
            'public_id'      => Ulid::generateWithPrefix('prm'),
            'permission_key' => $key,
        ], $keys);

        $this->db->table('permissions')->insertBatch($rows);
    }
}