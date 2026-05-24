<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        $roles       = $this->db->table('roles')->get()->getResult();
        $permissions = $this->db->table('permissions')->get()->getResult();

        $permissionMap = [];
        foreach ($permissions as $permission) {
            $permissionMap[$permission->permission_key] = $permission->id;
        }

        foreach ($roles as $role) {
            $rolePermissions = $this->permissionsFor(
                $role->role_slug,
                $permissionMap
            );

            if (! empty($rolePermissions)) {
                $rows = array_map(
                    static fn (int $permId): array => [
                        'role_id'       => $role->id,
                        'permission_id' => $permId,
                    ],
                    $rolePermissions
                );

                $this->db->table('role_permissions')->insertBatch($rows);
            }
        }
    }

    /**
     * Mapping role → permission keys.
     *
     * Catatan perubahan vs sebelumnya:
     *   - viewer: HAPUS exam.participate (sekarang punya student)
     *   - student (baru): exam.participate + face-reference.upload-own
     *   - admin-validator + super-admin: tambah face-reference.manage
     */
    private function permissionsFor(string $roleSlug, array $map): array
    {
        if ($roleSlug === 'super-admin') {
            return array_values($map);
        }

        $allowed = match ($roleSlug) {
            'admin-validator' => [
                'dashboard.view', 'analytics.view',
                'detection.view', 'detection.validate', 'detection.reject',
                'report.generate', 'report.download',
                'exam.manage', 'exam.review',
                'face-reference.manage',
                'users.manage',
            ],
            'operator-cctv' => [
                'dashboard.view',
                'cctv.live', 'cctv.replay',
                'detection.view',
                'exam.monitor',
            ],
            'analyst' => [
                'dashboard.view',
                'analytics.view', 'analytics.export',
                'detection.view',
                'report.generate', 'report.download',
                'exam.review',
            ],
            'viewer' => [
                'dashboard.view',
                'analytics.view',
                'detection.view',
            ],
            'student' => [
                'dashboard.view',
                'exam.participate',
                'face-reference.upload-own',
            ],
            default => [],
        };

        $ids = [];
        foreach ($allowed as $key) {
            if (isset($map[$key])) {
                $ids[] = $map[$key];
            }
        }

        return $ids;
    }
}