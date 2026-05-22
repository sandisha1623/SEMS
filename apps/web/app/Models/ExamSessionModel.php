<?php

namespace App\Models;

use App\Models\Traits\HasPublicId;
use CodeIgniter\Model;

class ExamSessionModel extends Model
{
    use HasPublicId;

    protected $table          = 'exam_sessions';
    protected $primaryKey     = 'id';
    protected $returnType     = 'array';
    protected $useSoftDeletes = true;
    protected $useTimestamps  = true;

    protected $publicIdPrefix = 'exm';

    protected $allowedFields = [
        'public_id', 'code', 'title', 'description', 'department_id',
        'mode', 'starts_at', 'ends_at', 'timezone',
        'duration_minutes', 'status', 'settings', 'created_by',
    ];

    protected $beforeInsert = ['setPublicIdBeforeInsert', 'castSettings'];
    protected $beforeUpdate = ['castSettings'];

    protected $validationRules = [
        // Wajib untuk placeholder safety (CI4 4.3.5+)
        'id'               => 'permit_empty|is_natural_no_zero',
        'code'             => 'required|max_length[50]|is_unique[exam_sessions.code,id,{id}]',
        'title'            => 'required|max_length[191]',
        'mode'             => 'required|in_list[online,offline,hybrid]',
        'starts_at'        => 'required|valid_date',
        'ends_at'          => 'required|valid_date',
        'duration_minutes' => 'required|integer|greater_than[0]',
        'status'           => 'required|in_list[draft,scheduled,ongoing,completed,cancelled]',
        'created_by'       => 'required|integer',
        'department_id'    => 'permit_empty|integer',
        'timezone'         => 'permit_empty|max_length[50]',
    ];

    protected function castSettings(array $data): array
    {
        if (isset($data['data']['settings']) && is_array($data['data']['settings'])) {
            $data['data']['settings'] = json_encode($data['data']['settings']);
        }
        return $data;
    }
}