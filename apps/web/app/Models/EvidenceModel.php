<?php

namespace App\Models;

use App\Models\Traits\HasPublicId;
use CodeIgniter\Model;

class EvidenceModel extends Model
{
    use HasPublicId;

    protected $table         = 'evidence';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $updatedField  = '';

    protected $publicIdPrefix = 'evd';

    protected $allowedFields = [
        'public_id', 'violation_id', 'participant_id', 'type',
        'file_path', 'mime_type', 'file_size', 'captured_at',
    ];

    protected $beforeInsert = ['setPublicIdBeforeInsert'];

    protected $validationRules = [
        'participant_id' => 'required|integer',
        'type'           => 'required|in_list[screenshot,video_clip,audio_clip]',
        'file_path'      => 'required|max_length[255]',
        'captured_at'    => 'required|valid_date',
    ];

    public function recentForParticipant(int $participantId, int $limit = 20): array
    {
        return $this
            ->where('participant_id', $participantId)
            ->orderBy('captured_at', 'DESC')
            ->limit($limit)
            ->findAll();
    }
}