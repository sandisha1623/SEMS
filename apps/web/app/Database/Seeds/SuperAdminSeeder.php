<?php

namespace App\Database\Seeds;

use App\Libraries\Ulid;
use CodeIgniter\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run()
    {
        $role = $this->db
            ->table('roles')
            ->where('role_slug', 'super-admin')
            ->get()
            ->getRow();

        if (! $role) {
            throw new \RuntimeException(
                'Role "super-admin" not found. Run RoleSeeder first.'
            );
        }

        $this->db->table('users')->insert([
            'public_id'     => Ulid::generateWithPrefix('usr'),
            'username'      => 'superadmin',
            'email'         => 'admin@sems.local',
            'password_hash' => password_hash('Admin123!', PASSWORD_ARGON2ID),
            'full_name'     => 'SEMS Super Admin',
            'role_id'       => $role->id,
            'is_active'     => 1,
            'created_at'    => date('Y-m-d H:i:s'),
        ]);
    }
}