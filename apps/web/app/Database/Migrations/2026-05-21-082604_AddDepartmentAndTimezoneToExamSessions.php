<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tambah kolom department_id + timezone ke exam_sessions.
 *
 * Dijalankan SETELAH CreateDepartmentsTable, jadi FK valid.
 *
 * department_id nullable supaya backward-compatible — sesi
 * existing yang sudah dibuat tanpa department tidak error.
 */
class AddDepartmentAndTimezoneToExamSessions extends Migration
{
    public function up()
    {
        $this->forge->addColumn('exam_sessions', [
            'department_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
                'null'       => true,
                'after'      => 'description',
                'comment'    => 'FK ke departments.id',
            ],
            'timezone' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'default'    => 'Asia/Jakarta',
                'after'      => 'ends_at',
                'comment'    => 'IANA timezone identifier',
            ],
        ]);

        $this->forge->addForeignKey(
            'department_id',
            'departments',
            'id',
            'SET NULL',
            'CASCADE',
            'fk_exam_sessions_department'
        );

        // CI4 Forge tidak punya addForeignKey untuk tabel existing,
        // kita harus pakai raw query.
        $prefix = $this->db->DBPrefix;
        $this->db->query(
            "ALTER TABLE `{$prefix}exam_sessions` "
            . "ADD CONSTRAINT `{$prefix}fk_exam_sessions_department` "
            . "FOREIGN KEY (`department_id`) "
            . "REFERENCES `{$prefix}departments`(`id`) "
            . "ON DELETE SET NULL ON UPDATE CASCADE"
        );

        $this->forge->addKey('department_id');
    }

    public function down()
    {
        $prefix = $this->db->DBPrefix;

        // Drop FK dulu sebelum drop column
        $this->db->query(
            "ALTER TABLE `{$prefix}exam_sessions` "
            . "DROP FOREIGN KEY `{$prefix}fk_exam_sessions_department`"
        );

        $this->forge->dropColumn('exam_sessions', ['department_id', 'timezone']);
    }
}