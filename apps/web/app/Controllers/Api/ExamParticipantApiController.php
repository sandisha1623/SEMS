<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ExamParticipantModel;
use App\Models\ExamSessionModel;

class ExamParticipantApiController extends BaseController
{
    protected ExamSessionModel     $sessions;
    protected ExamParticipantModel $participants;

    private const ORDERABLE_COLUMNS = [
        0 => 'users.username',
        1 => 'departments.name',
        2 => 'exam_participants.status',
        3 => 'exam_participants.verification_score',
        4 => 'exam_participants.created_at',
    ];

    private const SEARCHABLE_COLUMNS = [
        'users.username',
        'users.email',
        'users.full_name',
        'departments.name',
    ];

    public function __construct()
    {
        $this->sessions     = new ExamSessionModel();
        $this->participants = new ExamParticipantModel();
    }

    /**
     * GET /api/exam-sessions/{public_id}/participants/data
     */
    public function data(string $sessionPublicId)
    {
        $session = $this->sessions->findByPublicId($sessionPublicId);

        if (! $session) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['message' => 'Session not found']);
        }

        $sessionId = (int) $session['id'];

        $draw     = (int) ($this->request->getGet('draw') ?? 0);
        $start    = (int) ($this->request->getGet('start') ?? 0);
        $length   = (int) ($this->request->getGet('length') ?? 10);
        $search   = trim((string) ($this->request->getGet('search')['value'] ?? ''));
        $orderBy  = (int) ($this->request->getGet('order')[0]['column'] ?? 4);
        $orderDir = strtolower($this->request->getGet('order')[0]['dir'] ?? 'desc');

        $statusFilter = trim((string) $this->request->getGet('status_filter'));

        $orderColumn = self::ORDERABLE_COLUMNS[$orderBy] ?? 'exam_participants.created_at';
        $orderDir    = in_array($orderDir, ['asc', 'desc'], true) ? $orderDir : 'desc';

        // Total tanpa filter (hanya untuk session ini)
        $total = $this->participants
            ->where('session_id', $sessionId)
            ->countAllResults(false);

        $select = 'exam_participants.*, '
            . 'users.public_id AS user_public_id, '
            . 'users.username, users.email, users.full_name, '
            . 'departments.name AS department_name, departments.icon AS department_icon';

        $builder = $this->participants
            ->select($select)
            ->join('users', 'users.id = exam_participants.user_id')
            ->join('departments', 'departments.id = users.department_id', 'left')
            ->where('exam_participants.session_id', $sessionId);

        if ($statusFilter !== '') {
            $builder = $builder->where('exam_participants.status', $statusFilter);
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

    protected function transform(array $row): array
    {
        return [
            'public_id'          => $row['public_id'],
            'user_public_id'     => $row['user_public_id'],
            'username'           => $row['username'],
            'email'              => $row['email'],
            'full_name'          => $row['full_name'] ?? '',
            'department_name'    => $row['department_name'] ?? null,
            'department_icon'    => $row['department_icon'] ?? 'domain',
            'status'             => $row['status'],
            'status_badge'       => $this->statusBadge($row['status']),
            'verification_score' => $row['verification_score'],
            'verified_at'        => $row['verified_at'],
            'started_at'         => $row['started_at'],
            'submitted_at'       => $row['submitted_at'],
            'created_at'         => $row['created_at'],
        ];
    }

    protected function statusBadge(string $status): string
    {
        return match ($status) {
            'enrolled'     => 'secondary',
            'verifying'    => 'info',
            'in_progress'  => 'warning',
            'submitted'    => 'success',
            'disqualified' => 'danger',
            'absent'       => 'dark',
            default        => 'secondary',
        };
    }
}