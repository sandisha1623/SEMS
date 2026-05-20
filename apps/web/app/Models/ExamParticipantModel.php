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

    protected $allowedFields = [
        'public_id', 'session_id', 'user_id', 'status',
        'verification_score', 'verified_at', 'started_at', 'submitted_at',
        'client_ip', 'user_agent', 'notes',
    ];

    protected $beforeInsert = ['setPublicIdBeforeInsert'];

    protected $validationRules = [
        'session_id' => 'required|integer',
        'user_id'    => 'required|integer',
        'status'     => 'required|in_list[enrolled,verifying,in_progress,submitted,disqualified,absent]',
    ];

    public function isEnrolled(int $sessionId, int $userId): bool
    {
        return $this
            ->where('session_id', $sessionId)
            ->where('user_id', $userId)
            ->countAllResults() > 0;
    }

    public function findBySessionAndUser(int $sessionId, int $userId): ?array
    {
        return $this
            ->where('session_id', $sessionId)
            ->where('user_id', $userId)
            ->first();
    }
}