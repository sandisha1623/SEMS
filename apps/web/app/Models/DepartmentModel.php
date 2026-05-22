<?php

namespace App\Models;

use App\Models\Traits\HasPublicId;
use CodeIgniter\Model;

class DepartmentModel extends Model
{
    use HasPublicId;

    protected $table          = 'departments';
    protected $primaryKey     = 'id';
    protected $returnType     = 'array';
    protected $useSoftDeletes = true;
    protected $useTimestamps  = true;

    protected $publicIdPrefix = 'dpt';

    protected $allowedFields = [
        'public_id',
        'name',
        'faculty',
        'head_name',
        'icon',
        'code',
        'description',
        'is_active',
    ];

    protected $beforeInsert = ['setPublicIdBeforeInsert'];

    protected $validationRules = [
        // 'id' rule diperlukan supaya placeholder {id} di rule lain
        // (is_unique[...,id,{id}]) bisa ter-resolve. Sejak CI4 4.3.5,
        // setiap field yang dipakai sebagai placeholder WAJIB punya
        // rule sendiri — kalau tidak, error LogicException.
        // permit_empty supaya tidak required saat insert.
        'id'        => 'permit_empty|is_natural_no_zero',
        'name'      => 'required|max_length[150]|is_unique[departments.name,id,{id}]',
        'code'      => 'required|max_length[20]|is_unique[departments.code,id,{id}]',
        'faculty'   => 'permit_empty|max_length[150]',
        'head_name' => 'permit_empty|max_length[150]',
        'icon'      => 'permit_empty|max_length[50]',
        'is_active' => 'permit_empty|in_list[0,1]',
    ];

    protected $validationMessages = [
        'name' => ['is_unique' => 'Nama department sudah digunakan.'],
        'code' => ['is_unique' => 'Kode department sudah digunakan.'],
    ];

    public function dropdownOptions(): array
    {
        $rows = $this
            ->select('id, name')
            ->where('is_active', 1)
            ->orderBy('name', 'ASC')
            ->findAll();

        return array_column($rows, 'name', 'id');
    }

    public function summary(): array
    {
        $db = $this->db;

        $totalDepartments = $this->where('is_active', 1)->countAllResults();

        $activeExams = $db->table('exam_sessions')
            ->where('status', 'ongoing')
            ->where('deleted_at', null)
            ->countAllResults();

        return [
            'total_departments' => $totalDepartments,
            'students_total'    => null,
            'active_exams'      => $activeExams,
        ];
    }
}