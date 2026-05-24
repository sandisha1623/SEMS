<?php

namespace App\Models;

use App\Models\Traits\HasPublicId;
use CodeIgniter\Model;

class ExamParticipantModel extends Model
{
    use HasPublicId;

    protected $table         = 'exam_participants';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;

    protected $publicIdPrefix = 'par';

    public const STATUSES = [
        'enrolled'     => 'Enrolled',
        'verifying'    => 'Verifying',
        'in_progress'  => 'In Progress',
        'submitted'    => 'Submitted',
        'disqualified' => 'Disqualified',
        'absent'       => 'Absent',
    ];

    protected $allowedFields = [
        'public_id',
        'session_id',
        'user_id',
        'status',
        'verification_score',
        'verified_at',
        'started_at',
        'submitted_at',
        'client_ip',
        'user_agent',
        'notes',
    ];

    protected $beforeInsert = ['setPublicIdBeforeInsert'];

    protected $validationRules = [
        'id'         => 'permit_empty|is_natural_no_zero',
        'session_id' => 'required|integer',
        'user_id'    => 'required|integer',
        'status'     => 'required|in_list[enrolled,verifying,in_progress,submitted,disqualified,absent]',
    ];

    /**
     * Cek apakah user sudah enrolled di sesi tertentu.
     */
    public function isEnrolled(int $sessionId, int $userId): bool
    {
        return $this
            ->where('session_id', $sessionId)
            ->where('user_id', $userId)
            ->countAllResults() > 0;
    }

    /**
     * Find participant by session + user composite key.
     */
    public function findBySessionAndUser(int $sessionId, int $userId): ?array
    {
        return $this
            ->where('session_id', $sessionId)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Aggregate stats untuk panel atas halaman participants:
     *   - total      : semua enrolled
     *   - verified   : sudah lewat verifying (status: in_progress, submitted, disqualified)
     *   - in_progress
     *   - submitted
     */
    public function summaryBySession(int $sessionId): array
    {
        $rows = $this
            ->select('status, COUNT(*) AS cnt')
            ->where('session_id', $sessionId)
            ->groupBy('status')
            ->findAll();

        $byStatus = array_column($rows, 'cnt', 'status');

        $total       = array_sum($byStatus);
        $verified    = (int) ($byStatus['in_progress'] ?? 0)
                     + (int) ($byStatus['submitted'] ?? 0)
                     + (int) ($byStatus['disqualified'] ?? 0);

        return [
            'total'       => $total,
            'verified'    => $verified,
            'in_progress' => (int) ($byStatus['in_progress'] ?? 0),
            'submitted'   => (int) ($byStatus['submitted'] ?? 0),
        ];
    }
}