<?php

namespace App\Database\Seeds;

use App\Libraries\Ulid;
use CodeIgniter\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run()
    {
        $departments = [
            [
                'name'      => 'Teknik Informatika',
                'code'      => 'TI',
                'faculty'   => 'Fakultas Teknik',
                'head_name' => 'Dr. Ir. Budi Santoso, M.Kom.',
                'icon'      => 'code-tags',
            ],
            [
                'name'      => 'Sistem Informasi',
                'code'      => 'SI',
                'faculty'   => 'Fakultas Ilmu Komputer',
                'head_name' => 'Sari Rahayu, M.ST.',
                'icon'      => 'database',
            ],
            [
                'name'      => 'Teknik Elektro',
                'code'      => 'TE',
                'faculty'   => 'Fakultas Teknik',
                'head_name' => 'Prof. Ahmad Hidayat',
                'icon'      => 'flash',
            ],
            [
                'name'      => 'Manajemen Bisnis',
                'code'      => 'MB',
                'faculty'   => 'Fakultas Ekonomi',
                'head_name' => 'Dra. Linda Wijaya, M.M.',
                'icon'      => 'briefcase',
            ],
            [
                'name'      => 'Matematika',
                'code'      => 'MAT',
                'faculty'   => 'Fakultas MIPA',
                'head_name' => 'Dr. Rina Pratiwi, M.Si.',
                'icon'      => 'function-variant',
            ],
            [
                'name'      => 'Fisika',
                'code'      => 'FIS',
                'faculty'   => 'Fakultas MIPA',
                'head_name' => 'Dr. Andi Wibowo, M.Sc.',
                'icon'      => 'atom',
            ],
            [
                'name'      => 'Akuntansi',
                'code'      => 'AKT',
                'faculty'   => 'Fakultas Ekonomi',
                'head_name' => 'Drs. Eko Prabowo, Ak., M.M.',
                'icon'      => 'calculator',
            ],
            [
                'name'      => 'Teknik Industri',
                'code'      => 'TIN',
                'faculty'   => 'Fakultas Teknik',
                'head_name' => 'Ir. Maya Susanti, M.T.',
                'icon'      => 'factory',
            ],
        ];

        $now  = date('Y-m-d H:i:s');
        $rows = array_map(static fn (array $dept): array => [
            'public_id'  => Ulid::generateWithPrefix('dpt'),
            'name'       => $dept['name'],
            'faculty'    => $dept['faculty'],
            'head_name'  => $dept['head_name'],
            'icon'       => $dept['icon'],
            'code'       => $dept['code'],
            'is_active'  => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ], $departments);

        $this->db->table('departments')->insertBatch($rows);
    }
}