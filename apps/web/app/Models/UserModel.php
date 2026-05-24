<?php

namespace App\Models;

use App\Models\Traits\HasPublicId;
use CodeIgniter\Model;

class UserModel extends Model
{
    use HasPublicId;

    protected $table          = 'users';
    protected $primaryKey     = 'id';
    protected $returnType     = 'array';
    protected $useTimestamps  = true;
    protected $useSoftDeletes = true;

    protected $publicIdPrefix = 'usr';

    /** Slug role yang wajib punya department. */
    private const ROLES_REQUIRING_DEPARTMENT = ['student'];

    protected $allowedFields = [
        'public_id',
        'role_id',
        'department_id',
        'username',
        'email',
        'password_hash',
        'full_name',
        'is_active',
        'last_login_at',
        'last_login_ip',
    ];

    protected $beforeInsert = ['setPublicIdBeforeInsert'];

    protected $validationRules = [
        // Wajib untuk placeholder safety (CI4 4.3.5+)
        'id'            => 'permit_empty|is_natural_no_zero',
        'username'      => 'required|min_length[3]|max_length[50]|is_unique[users.username,id,{id}]',
        'email'         => 'required|valid_email|is_unique[users.email,id,{id}]',
        'role_id'       => 'required|integer',
        'department_id' => 'permit_empty|integer',
        'full_name'     => 'permit_empty|max_length[100]',
        'is_active'     => 'permit_empty|in_list[0,1]',
    ];

    protected $validationMessages = [
        'username' => ['is_unique' => 'Username sudah digunakan.'],
        'email'    => ['is_unique' => 'Email sudah digunakan.'],
    ];

    /**
     * Validasi conditional: role student wajib punya department_id.
     *
     * Dipanggil dari controller setelah ekstrak form data.
     * Return array errors (kosong kalau lulus).
     */
    public function validateConditional(array $data): array
    {
        $errors = [];

        $roleId = (int) ($data['role_id'] ?? 0);
        $deptId = $data['department_id'] ?? null;

        if ($roleId > 0) {
            $role = $this->db
                ->table('roles')
                ->where('id', $roleId)
                ->get()
                ->getRowArray();

            if ($role
                && in_array($role['role_slug'], self::ROLES_REQUIRING_DEPARTMENT, true)
                && empty($deptId)
            ) {
                $errors['department_id'] =
                    'Department wajib diisi untuk role ' . $role['role_slug'] . '.';
            }
        }

        return $errors;
    }

    /**
     * Helper untuk login flow.
     */
    public function findForLogin(string $username): ?array
    {
        return $this
            ->select('users.*, roles.role_slug')
            ->join('roles', 'roles.id = users.role_id')
            ->where('users.username', $username)
            ->where('users.is_active', 1)
            ->first();
    }

    /**
     * Hitung jumlah student aktif per department.
     * Dipakai oleh DepartmentModel::summary().
     *
     * Return: [department_id => count, ...]
     */
    public function countStudentsByDepartment(?array $departmentIds = null): array
    {
        $builder = $this->db->table($this->table)
            ->select('users.department_id, COUNT(*) AS cnt')
            ->join('roles', 'roles.id = users.role_id')
            ->where('roles.role_slug', 'student')
            ->where('users.is_active', 1)
            ->where('users.deleted_at', null)
            ->where('users.department_id !=', null)
            ->groupBy('users.department_id');

        if ($departmentIds !== null) {
            if (empty($departmentIds)) {
                return [];
            }
            $builder = $builder->whereIn('users.department_id', $departmentIds);
        }

        $rows = $builder->get()->getResultArray();

        return array_column($rows, 'cnt', 'department_id');
    }

    /**
     * Total student aktif (semua department).
     */
    public function totalStudents(): int
    {
        return $this->db->table($this->table)
            ->join('roles', 'roles.id = users.role_id')
            ->where('roles.role_slug', 'student')
            ->where('users.is_active', 1)
            ->where('users.deleted_at', null)
            ->countAllResults();
    }
}