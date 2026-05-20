<?php

namespace App\Database\Seeds;

use App\Libraries\Ulid;
use CodeIgniter\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            ['role_name' => 'Super Admin',      'role_slug' => 'super-admin'],
            ['role_name' => 'Admin Validator',  'role_slug' => 'admin-validator'],
            ['role_name' => 'Operator CCTV',    'role_slug' => 'operator-cctv'],
            ['role_name' => 'Analyst',          'role_slug' => 'analyst'],
            ['role_name' => 'Viewer',           'role_slug' => 'viewer'],
        ];

        // Tambahkan public_id ULID untuk tiap row.
        // Tidak pakai Model::insertBatch karena role tidak punya
        // Model dedicated; manual fill di sini sudah cukup.
        $rows = array_map(static function (array $role): array {
            return [
                'public_id' => Ulid::generateWithPrefix('rol'),
                ...$role,
            ];
        }, $roles);

        $this->db->table('roles')->insertBatch($rows);
    }
}