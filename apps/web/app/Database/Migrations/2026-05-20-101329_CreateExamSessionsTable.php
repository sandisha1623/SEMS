<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateExamSessionsTable extends Migration
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
                'comment'    => 'exm_<ULID>',
            ],
            'code' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'comment'    => 'Kode unik sesi, mis. UTS-IF101-2026A',
            ],
            'title' => [
                'type'       => 'VARCHAR',
                'constraint' => 191,
            ],
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'mode' => [
                'type'       => 'ENUM',
                'constraint' => ['online', 'offline', 'hybrid'],
                'default'    => 'online',
            ],
            'starts_at' => [
                'type' => 'DATETIME',
            ],
            'ends_at' => [
                'type' => 'DATETIME',
            ],
            'duration_minutes' => [
                'type'     => 'INT',
                'unsigned' => true,
                'comment'  => 'Durasi ujian per peserta (menit)',
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['draft', 'scheduled', 'ongoing', 'completed', 'cancelled'],
                'default'    => 'draft',
            ],
            'settings' => [
                'type'    => 'JSON',
                'null'    => true,
                'comment' => 'face_verify, face_monitor, multi_face_alert, dst',
            ],
            'created_by' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
            'deleted_at' => ['type' => 'DATETIME', 'null' => true],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('public_id');
        $this->forge->addUniqueKey('code');
        $this->forge->addKey('status');
        $this->forge->addKey('starts_at');

        $this->forge->addForeignKey('created_by', 'users', 'id', 'RESTRICT', 'CASCADE');

        $this->forge->createTable('exam_sessions');
    }

    public function down()
    {
        $this->forge->dropTable('exam_sessions');
    }
}