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

    /**
     * Aggregate stats untuk panel atas halaman list.
     *
     * Sekarang students_total dihitung live dari UserModel
     * (sebelumnya placeholder null).
     */
    public function summary(): array
    {
        $totalDepartments = $this->where('is_active', 1)->countAllResults();

        $activeExams = $this->db->table('exam_sessions')
            ->where('status', 'ongoing')
            ->where('deleted_at', null)
            ->countAllResults();

        $studentsTotal = (new UserModel())->totalStudents();

        return [
            'total_departments' => $totalDepartments,
            'students_total'    => $studentsTotal,
            'active_exams'      => $activeExams,
        ];
    }
}