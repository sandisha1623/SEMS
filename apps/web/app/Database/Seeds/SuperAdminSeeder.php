<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use Ramsey\Uuid\Uuid;

class SuperAdminSeeder extends Seeder
{
    public function run()
    {
        $role = $this->db
            ->table('roles')
            ->where('role_slug', 'super-admin')
            ->get()
            ->getRow();

        $this->db->table('users')->insert([

            'uuid' => Uuid::uuid4()->toString(),

            'username' => 'superadmin',

            'email' => 'admin@sems.local',

            'password_hash' => password_hash(
                'Admin123!',
                PASSWORD_ARGON2ID
            ),

            'full_name' => 'SEMS Super Admin',

            'role_id' => $role->id,

            'is_active' => 1,

            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }
}