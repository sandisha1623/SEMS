<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = [

            [
                'role_name' => 'Super Admin',
                'role_slug' => 'super-admin',
            ],

            [
                'role_name' => 'Admin Validator',
                'role_slug' => 'admin-validator',
            ],

            [
                'role_name' => 'Operator CCTV',
                'role_slug' => 'operator-cctv',
            ],

            [
                'role_name' => 'Analyst',
                'role_slug' => 'analyst',
            ],

            [
                'role_name' => 'Viewer',
                'role_slug' => 'viewer',
            ],

        ];

        $this->db->table('roles')->insertBatch($roles);
    }
}