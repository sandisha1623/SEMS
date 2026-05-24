<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\DepartmentModel;
use App\Models\UserModel;

class DepartmentApiController extends BaseController
{
    protected DepartmentModel $model;

    private const ORDERABLE_COLUMNS = [
        0 => 'name',        // Departemen
        1 => 'head_name',   // Kaprodi
        2 => 'name',        // Mahasiswa (computed, not orderable)
        3 => 'name',        // Ujian Aktif (computed, not orderable)
        4 => 'is_active',   // Status
    ];

    private const SEARCHABLE_COLUMNS = ['code', 'name', 'faculty', 'head_name', 'description'];

    public function __construct()
    {
        $this->model = new DepartmentModel();
    }

    public function data()
    {
        $draw     = (int) ($this->request->getGet('draw') ?? 0);
        $start    = (int) ($this->request->getGet('start') ?? 0);
        $length   = (int) ($this->request->getGet('length') ?? 10);
        $search   = trim((string) ($this->request->getGet('search')['value'] ?? ''));
        $orderBy  = (int) ($this->request->getGet('order')[0]['column'] ?? 0);
        $orderDir = strtolower($this->request->getGet('order')[0]['dir'] ?? 'asc');

        $orderColumn = self::ORDERABLE_COLUMNS[$orderBy] ?? 'name';
        $orderDir    = in_array($orderDir, ['asc', 'desc'], true) ? $orderDir : 'asc';

        $total = $this->model->countAllResults(false);

        $builder = $this->model;
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

        // Aggregate counts dalam 1 query masing-masing (hindari N+1).
        $departmentIds    = array_column($rows, 'id');
        $activeExamCounts = $this->countActiveExamsByDepartment($departmentIds);
        $studentCounts    = (new UserModel())->countStudentsByDepartment($departmentIds);

        return $this->response->setJSON([
            'draw'            => $draw,
            'recordsTotal'    => $total,
            'recordsFiltered' => $filtered,
            'data'            => array_map(
                fn (array $row): array => $this->transform($row, $activeExamCounts, $studentCounts),
                $rows
            ),
        ]);
    }

    /**
     * Return [department_id => active_exam_count].
     */
    protected function countActiveExamsByDepartment(array $departmentIds): array
    {
        if (empty($departmentIds)) {
            return [];
        }

        $rows = $this->model->db
            ->table('exam_sessions')
            ->select('department_id, COUNT(*) AS cnt')
            ->whereIn('department_id', $departmentIds)
            ->where('status', 'ongoing')
            ->where('deleted_at', null)
            ->groupBy('department_id')
            ->get()
            ->getResultArray();

        return array_column($rows, 'cnt', 'department_id');
    }

    protected function transform(array $row, array $activeExamCounts, array $studentCounts): array
    {
        return [
            'public_id'    => $row['public_id'],
            'code'         => $row['code'],
            'name'         => $row['name'],
            'faculty'      => $row['faculty'] ?? '',
            'head_name'    => $row['head_name'] ?? '',
            'icon'         => $row['icon'] ?? 'domain',
            'description'  => $row['description'] ?? '',
            'is_active'    => (int) $row['is_active'],
            'students'     => (int) ($studentCounts[$row['id']] ?? 0),
            'active_exams' => (int) ($activeExamCounts[$row['id']] ?? 0),
        ];
    }
}