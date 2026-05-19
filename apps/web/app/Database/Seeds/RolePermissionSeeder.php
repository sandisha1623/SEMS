<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        $roles = $this->db->table('roles')->get()->getResult();
        $permissions = $this->db->table('permissions')->get()->getResult();

        $permissionMap = [];

        foreach ($permissions as $permission) {
            $permissionMap[$permission->permission_key] = $permission->id;
        }

        foreach ($roles as $role) {

            $rolePermissions = [];

            if ($role->role_slug === 'super-admin') {

                foreach ($permissions as $permission) {

                    $rolePermissions[] = [
                        'role_id'       => $role->id,
                        'permission_id' => $permission->id,
                    ];
                }
            }

            if ($role->role_slug === 'viewer') {

                $allowed = [
                    'dashboard.view',
                    'analytics.view',
                    'detection.view',
                ];

                foreach ($allowed as $key) {

                    $rolePermissions[] = [
                        'role_id'       => $role->id,
                        'permission_id' => $permissionMap[$key],
                    ];
                }
            }

            if (! empty($rolePermissions)) {

                $this->db
                    ->table('role_permissions')
                    ->insertBatch($rolePermissions);
            }
        }
    }
}