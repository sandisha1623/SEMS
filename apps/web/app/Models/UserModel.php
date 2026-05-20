<?php

namespace App\Models;

use App\Models\Traits\HasPublicId;
use CodeIgniter\Model;

class UserModel extends Model
{
    use HasPublicId;

    protected $table          = 'users';
    protected $primaryKey     = 'id';
    protected $returnType     = 'array';
    protected $useTimestamps  = true;
    protected $useSoftDeletes = true;

    protected $publicIdPrefix = 'usr';

    protected $allowedFields = [
        'public_id',
        'role_id',
        'username',
        'email',
        'password_hash',
        'full_name',
        'is_active',
        'last_login_at',
        'last_login_ip',
    ];

    protected $beforeInsert = ['setPublicIdBeforeInsert'];

    protected $validationRules = [
        'username' => 'required|min_length[3]|max_length[50]|is_unique[users.username,id,{id}]',
        'email'    => 'required|valid_email|is_unique[users.email,id,{id}]',
        'role_id'  => 'required|integer',
    ];

    /**
     * Helper untuk login flow: load user + role slug dalam satu query.
     */
    public function findForLogin(string $username): ?array
    {
        return $this
            ->select('users.*, roles.role_slug')
            ->join('roles', 'roles.id = users.role_id')
            ->where('users.username', $username)
            ->where('users.is_active', 1)
            ->first();
    }
}