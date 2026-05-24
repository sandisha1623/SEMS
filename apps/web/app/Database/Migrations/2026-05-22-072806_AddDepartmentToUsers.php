<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tambah kolom department_id ke users.
 *
 * Nullable karena super-admin, operator, dll. tidak selalu
 * terikat ke department tertentu. Validation "wajib untuk role
 * student" di-handle di application layer (UserModel).
 */
class AddDepartmentToUsers extends Migration
{
    public function up()
    {
        $this->forge->addColumn('users', [
            'department_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
                'null'       => true,
                'after'      => 'role_id',
                'comment'    => 'FK ke departments.id. Wajib untuk role student.',
            ],
        ]);

        // CI4 Forge tidak punya addForeignKey untuk ALTER, pakai raw query
        $prefix = $this->db->DBPrefix;
        $this->db->query(
            "ALTER TABLE `{$prefix}users` "
            . "ADD CONSTRAINT `{$prefix}fk_users_department` "
            . "FOREIGN KEY (`department_id`) "
            . "REFERENCES `{$prefix}departments`(`id`) "
            . "ON DELETE SET NULL ON UPDATE CASCADE"
        );
    }

    public function down()
    {
        $prefix = $this->db->DBPrefix;

        $this->db->query(
            "ALTER TABLE `{$prefix}users` "
            . "DROP FOREIGN KEY `{$prefix}fk_users_department`"
        );

        $this->forge->dropColumn('users', 'department_id');
    }
}