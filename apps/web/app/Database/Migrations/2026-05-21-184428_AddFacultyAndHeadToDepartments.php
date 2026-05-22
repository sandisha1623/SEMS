<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tambah field tambahan ke departments untuk match desain UI:
 *   - faculty   : nama fakultas (Fakultas Teknik, dst)
 *   - head_name : nama kaprodi/kepala department
 *   - icon      : MDI icon identifier untuk ditampilkan di list
 */
class AddFacultyAndHeadToDepartments extends Migration
{
    public function up()
    {
        $this->forge->addColumn('departments', [
            'faculty' => [
                'type'       => 'VARCHAR',
                'constraint' => 150,
                'null'       => true,
                'after'      => 'name',
                'comment'    => 'Nama fakultas, mis. "Fakultas Teknik"',
            ],
            'head_name' => [
                'type'       => 'VARCHAR',
                'constraint' => 150,
                'null'       => true,
                'after'      => 'faculty',
                'comment'    => 'Nama kaprodi / kepala department',
            ],
            'icon' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'default'    => 'domain',
                'after'      => 'head_name',
                'comment'    => 'MDI icon identifier (tanpa prefix mdi-)',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('departments', ['faculty', 'head_name', 'icon']);
    }
}