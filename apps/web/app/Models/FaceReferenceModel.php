<?php

namespace App\Models;

use App\Models\Traits\HasPublicId;
use CodeIgniter\Model;

class FaceReferenceModel extends Model
{
    use HasPublicId;

    protected $table         = 'face_references';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;

    protected $publicIdPrefix = 'frf';

    protected $allowedFields = [
        'public_id', 'user_id', 'file_path', 'file_hash', 'mime_type',
        'embedding', 'embedding_model', 'status', 'note', 'uploaded_by',
    ];

    protected $beforeInsert = ['setPublicIdBeforeInsert', 'castEmbedding'];
    protected $beforeUpdate = ['castEmbedding'];

    protected $validationRules = [
        'user_id'   => 'required|integer',
        'file_path' => 'required|max_length[255]',
        'status'    => 'required|in_list[active,archived,rejected]',
    ];

    public function getActiveForUser(int $userId): ?array
    {
        return $this
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->orderBy('created_at', 'DESC')
            ->first();
    }

    protected function castEmbedding(array $data): array
    {
        if (isset($data['data']['embedding']) && is_array($data['data']['embedding'])) {
            $data['data']['embedding'] = json_encode($data['data']['embedding']);
        }
        return $data;
    }
}