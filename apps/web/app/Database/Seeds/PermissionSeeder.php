<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        $permissions = [

            ['permission_key' => 'dashboard.view'],
            ['permission_key' => 'analytics.view'],
            ['permission_key' => 'analytics.export'],

            ['permission_key' => 'detection.view'],
            ['permission_key' => 'detection.validate'],
            ['permission_key' => 'detection.reject'],

            ['permission_key' => 'cctv.live'],
            ['permission_key' => 'cctv.replay'],

            ['permission_key' => 'report.generate'],
            ['permission_key' => 'report.download'],

            ['permission_key' => 'users.manage'],
            ['permission_key' => 'roles.manage'],
            ['permission_key' => 'settings.manage'],

            ['permission_key' => 'ai.manage'],

        ];

        $this->db
            ->table('permissions')
            ->insertBatch($permissions);
    }
}