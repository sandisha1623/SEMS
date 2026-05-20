<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateEvidenceTable extends Migration
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
                'comment'    => 'evd_<ULID>',
            ],
            'violation_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
                'null'       => true,
                'comment'    => 'Null jika evidence belum link ke violation',
            ],
            'participant_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'type' => [
                'type'       => 'ENUM',
                'constraint' => ['screenshot', 'video_clip', 'audio_clip'],
                'default'    => 'screenshot',
            ],
            'file_path' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'mime_type' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'null'       => true,
            ],
            'file_size' => [
                'type'     => 'BIGINT',
                'unsigned' => true,
                'null'     => true,
            ],
            'captured_at' => ['type' => 'DATETIME'],
            'created_at'  => ['type' => 'DATETIME', 'null' => true],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('public_id');
        $this->forge->addKey('violation_id');
        $this->forge->addKey('participant_id');
        $this->forge->addKey('captured_at');

        $this->forge->addForeignKey('violation_id', 'violations', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('participant_id', 'exam_participants', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('evidence');
    }

    public function down()
    {
        $this->forge->dropTable('evidence');
    }
}