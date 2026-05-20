<?php

namespace App\Models;

use App\Models\Traits\HasPublicId;
use CodeIgniter\Model;

class ViolationModel extends Model
{
    use HasPublicId;

    protected $table         = 'violations';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;

    protected $publicIdPrefix = 'vio';

    protected $allowedFields = [
        'public_id', 'participant_id', 'type', 'severity', 'confidence',
        'metadata', 'occurred_at', 'reviewed_at', 'reviewed_by',
        'review_status', 'review_note',
    ];

    protected $beforeInsert = ['setPublicIdBeforeInsert', 'castMetadata'];
    protected $beforeUpdate = ['castMetadata'];

    protected $validationRules = [
        'participant_id' => 'required|integer',
        'type'           => 'required|max_length[50]',
        'severity'       => 'required|in_list[low,medium,high,critical]',
        'occurred_at'    => 'required|valid_date',
        'review_status'  => 'permit_empty|in_list[pending,confirmed,dismissed,false_positive]',
    ];

    public function summaryByParticipant(int $participantId): array
    {
        return $this
            ->select('type, severity, COUNT(*) as count')
            ->where('participant_id', $participantId)
            ->groupBy(['type', 'severity'])
            ->findAll();
    }

    protected function castMetadata(array $data): array
    {
        if (isset($data['data']['metadata']) && is_array($data['data']['metadata'])) {
            $data['data']['metadata'] = json_encode($data['data']['metadata']);
        }
        return $data;
    }
}