<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\DepartmentModel;

class DepartmentApiController extends BaseController
{
    protected DepartmentModel $model;

    private const ORDERABLE_COLUMNS = [
        0 => 'code',
        1 => 'name',
        2 => 'is_active',
    ];

    private const SEARCHABLE_COLUMNS = ['code', 'name', 'description'];

    public function __construct()
    {
        $this->model = new DepartmentModel();
    }

    /**
     * GET /api/departments/data
     */
    public function data()
    {
        $draw     = (int) ($this->request->getGet('draw') ?? 0);
        $start    = (int) ($this->request->getGet('start') ?? 0);
        $length   = (int) ($this->request->getGet('length') ?? 10);
        $search   = trim((string) ($this->request->getGet('search')['value'] ?? ''));
        $orderBy  = (int) ($this->request->getGet('order')[0]['column'] ?? 1);
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

    protected function transform(array $row): array
    {
        return [
            'public_id'   => $row['public_id'],
            'code'        => $row['code'],
            'name'        => $row['name'],
            'head_name'   => $row['head_name'],
            'icon'        => $row['icon'],
            'description' => $row['description'] ?? '',
            'is_active'   => (int) $row['is_active'],
        ];
    }
}