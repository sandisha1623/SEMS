<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\UserModel;

class UserApiController extends BaseController
{
    protected UserModel $model;

    private const ORDERABLE_COLUMNS = [
        0 => 'users.username',
        1 => 'users.full_name',
        2 => 'roles.role_name',
        3 => 'departments.name',
        4 => 'users.is_active',
    ];

    private const SEARCHABLE_COLUMNS = [
        'users.username',
        'users.email',
        'users.full_name',
        'roles.role_name',
        'departments.name',
    ];

    public function __construct()
    {
        $this->model = new UserModel();
    }

    /**
     * GET /api/users/data — DataTables endpoint untuk halaman users
     */
    public function data()
    {
        $draw     = (int) ($this->request->getGet('draw') ?? 0);
        $start    = (int) ($this->request->getGet('start') ?? 0);
        $length   = (int) ($this->request->getGet('length') ?? 10);
        $search   = trim((string) ($this->request->getGet('search')['value'] ?? ''));
        $orderBy  = (int) ($this->request->getGet('order')[0]['column'] ?? 0);
        $orderDir = strtolower($this->request->getGet('order')[0]['dir'] ?? 'asc');

        $roleFilter   = trim((string) $this->request->getGet('role_filter'));
        $statusFilter = $this->request->getGet('status_filter');

        $orderColumn = self::ORDERABLE_COLUMNS[$orderBy] ?? 'users.username';
        $orderDir    = in_array($orderDir, ['asc', 'desc'], true) ? $orderDir : 'asc';

        $baseSelect = 'users.*, '
            . 'roles.role_name, roles.role_slug, '
            . 'departments.name AS department_name, departments.icon AS department_icon';

        $total = $this->model->countAllResults(false);

        $builder = $this->model
            ->select($baseSelect)
            ->join('roles', 'roles.id = users.role_id')
            ->join('departments', 'departments.id = users.department_id', 'left');

        if ($roleFilter !== '') {
            $builder = $builder->where('roles.role_slug', $roleFilter);
        }

        if ($statusFilter !== null && $statusFilter !== '') {
            $builder = $builder->where('users.is_active', (int) $statusFilter);
        }

        if ($search !== '') {
            $builder = $builder->groupStart();
            foreach (self::SEARCHABLE_COLUMNS as $i => $col) {
                if ($i === 0) {
                    $builder = $builder->like($col, $search);
                } else {
                    $builder = $builder->orLike($col, $search);
                }
            }
            $builder = $builder->groupEnd();
        }

        $filtered = $builder->countAllResults(false);

        $rows = $builder
            ->orderBy($orderColumn, $orderDir)
            ->findAll($length, $start);

        return $this->response->setJSON([
            'draw'            => $draw,
            'recordsTotal'    => $total,
            'recordsFiltered' => $filtered,
            'data'            => array_map(
                fn (array $row): array => $this->transform($row),
                $rows
            ),
        ]);
    }

    /**
     * GET /api/users/searchable-students
     */
    public function searchableStudents()
    {
        $q            = trim((string) $this->request->getGet('q'));
        $departmentId = $this->request->getGet('department_id');
        $sessionPid   = trim((string) $this->request->getGet('session_id'));
        $limit        = min((int) ($this->request->getGet('limit') ?? 50), 100);

        $db     = $this->model->db;
        $prefix = $db->DBPrefix;

        // Resolve session public_id → internal id
        $sessionInternalId = null;
        if ($sessionPid !== '') {
            $sessionRow = $db
                ->table('exam_sessions')
                ->select('id')
                ->where('public_id', $sessionPid)
                ->get()
                ->getRowArray();

            if ($sessionRow) {
                $sessionInternalId = (int) $sessionRow['id'];
            }
        }

        // PATTERN: split select calls.
        // - select() pertama: regular columns, ESCAPE = true (default)
        //   supaya CI4 auto-prefix users → sm_users
        // - select() kedua: subquery dengan ESCAPE = false (subquery tidak
        //   boleh di-escape, dan kita tulis prefix sm_ manual di dalamnya)
        //
        // Note: dalam subquery, reference ke main table HARUS pakai prefix
        // manual ({$prefix}users.id) karena escape sudah false.
        $regularFields = 'users.id, users.public_id, users.username, '
            . 'users.email, users.full_name, '
            . 'departments.name AS department_name, '
            . 'departments.icon AS department_icon';

        $faceRefSubquery = "(SELECT COUNT(*) FROM {$prefix}face_references fr "
            . "WHERE fr.user_id = {$prefix}users.id AND fr.status = 'active') "
            . "AS face_ref_count";

        $builder = $this->model
            ->select($regularFields)                  // escape default = true
            ->select($faceRefSubquery, false)         // escape = false untuk subquery
            ->join('roles', 'roles.id = users.role_id')
            ->join('departments', 'departments.id = users.department_id', 'left')
            ->where('roles.role_slug', 'student')
            ->where('users.is_active', 1)
            ->where('users.deleted_at', null);

        if ($q !== '') {
            $builder = $builder
                ->groupStart()
                ->like('users.username',  $q)
                ->orLike('users.email',    $q)
                ->orLike('users.full_name', $q)
                ->groupEnd();
        }

        if ($departmentId !== null && $departmentId !== '') {
            $builder = $builder->where('users.department_id', (int) $departmentId);
        }

        if ($sessionInternalId !== null) {
            $enrolledRows = $db->table('exam_participants')
                ->select('user_id')
                ->where('session_id', $sessionInternalId)
                ->get()
                ->getResultArray();

            if (! empty($enrolledRows)) {
                $ids = array_map('intval', array_column($enrolledRows, 'user_id'));
                $builder = $builder->whereNotIn('users.id', $ids);
            }
        }

        $rows = $builder
            ->orderBy('users.full_name', 'ASC')
            ->orderBy('users.username',  'ASC')
            ->findAll($limit);

        return $this->response->setJSON([
            'success' => true,
            'data'    => array_map(
                fn (array $row): array => [
                    'public_id'          => $row['public_id'],
                    'username'           => $row['username'],
                    'email'              => $row['email'],
                    'full_name'          => $row['full_name'] ?? '',
                    'department_name'    => $row['department_name'],
                    'department_icon'    => $row['department_icon'] ?? 'domain',
                    'has_face_reference' => (int) $row['face_ref_count'] > 0,
                ],
                $rows
            ),
            'count' => count($rows),
            'limit' => $limit,
        ]);
    }

    protected function transform(array $row): array
    {
        return [
            'public_id'       => $row['public_id'],
            'username'        => $row['username'],
            'email'           => $row['email'],
            'full_name'       => $row['full_name'] ?? '',
            'role_name'       => $row['role_name'],
            'role_slug'       => $row['role_slug'],
            'department_name' => $row['department_name'] ?? null,
            'department_icon' => $row['department_icon'] ?? 'domain',
            'is_active'       => (int) $row['is_active'],
            'last_login_at'   => $row['last_login_at'] ?? null,
        ];
    }
}