<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateDepartmentsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'BIGINT',
                'constraint'     => 20,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'public_id' => [
                'type'       => 'CHAR',
                'constraint' => 30,
                'comment'    => 'dpt_<ULID>',
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 150,
                'comment'    => 'Nama lengkap, mis. "Computer Science & Engineering"',
            ],
            'code' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'comment'    => 'Kode pendek, mis. "CSE"',
            ],
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'is_active' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
            'deleted_at' => ['type' => 'DATETIME', 'null' => true],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('public_id');
        $this->forge->addUniqueKey('code');
        $this->forge->addKey('is_active');

        $this->forge->createTable('departments');
    }

    public function down()
    {
        $this->forge->dropTable('departments');
    }
}