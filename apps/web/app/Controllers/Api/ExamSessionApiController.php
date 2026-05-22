<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ExamSessionModel;

class ExamSessionApiController extends BaseController
{
    protected ExamSessionModel $model;

    private const ORDERABLE_COLUMNS = [
        0 => 'code',
        1 => 'title',
        2 => 'departments.name',
        3 => 'starts_at',
        4 => 'status',
    ];

    private const SEARCHABLE_COLUMNS = [
        'exam_sessions.code',
        'exam_sessions.title',
        'exam_sessions.description',
        'departments.name',
    ];

    public function __construct()
    {
        $this->model = new ExamSessionModel();
    }

    public function data()
    {
        $draw     = (int) ($this->request->getGet('draw') ?? 0);
        $start    = (int) ($this->request->getGet('start') ?? 0);
        $length   = (int) ($this->request->getGet('length') ?? 10);
        $search   = trim((string) ($this->request->getGet('search')['value'] ?? ''));
        $orderBy  = (int) ($this->request->getGet('order')[0]['column'] ?? 3);
        $orderDir = strtolower($this->request->getGet('order')[0]['dir'] ?? 'desc');

        $orderColumn = self::ORDERABLE_COLUMNS[$orderBy] ?? 'exam_sessions.starts_at';
        $orderDir    = in_array($orderDir, ['asc', 'desc'], true) ? $orderDir : 'desc';

        // Total tanpa filter
        $total = $this->model->countAllResults(false);

        // Builder dengan join ke departments — supaya bisa search by dept name
        // & display dept name di kolom
        $builder = $this->model
            ->select('exam_sessions.*, departments.name AS department_name, departments.icon AS department_icon')
            ->join('departments', 'departments.id = exam_sessions.department_id', 'left');

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
            'public_id'       => $row['public_id'],
            'code'            => $row['code'],
            'title'           => $row['title'],
            'department_name' => $row['department_name'] ?? null,
            'department_icon' => $row['department_icon'] ?? 'domain',
            'mode'            => $row['mode'],
            'starts_at'       => $row['starts_at'],
            'ends_at'         => $row['ends_at'],
            'duration'        => $row['duration_minutes'],
            'status'          => $row['status'],
            'status_badge'    => $this->statusBadge($row['status']),
        ];
    }

    protected function statusBadge(string $status): string
    {
        return match ($status) {
            'draft'      => 'secondary',
            'scheduled'  => 'info',
            'ongoing'    => 'warning',
            'completed'  => 'success',
            'cancelled'  => 'danger',
            default      => 'secondary',
        };
    }
}