<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateExamParticipantsTable extends Migration
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
                'comment'    => 'par_<ULID>',
            ],
            'session_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'user_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => [
                    'enrolled',
                    'verifying',
                    'in_progress',
                    'submitted',
                    'disqualified',
                    'absent',
                ],
                'default' => 'enrolled',
            ],
            'verification_score' => [
                'type'       => 'DECIMAL',
                'constraint' => '5,4',
                'null'       => true,
                'comment'    => 'Confidence face verification',
            ],
            'verified_at'  => ['type' => 'DATETIME', 'null' => true],
            'started_at'   => ['type' => 'DATETIME', 'null' => true],
            'submitted_at' => ['type' => 'DATETIME', 'null' => true],
            'client_ip' => [
                'type'       => 'VARCHAR',
                'constraint' => 45,
                'null'       => true,
            ],
            'user_agent' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'notes' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('public_id');
        $this->forge->addUniqueKey(['session_id', 'user_id']);
        $this->forge->addKey('status');
        $this->forge->addKey('user_id');

        $this->forge->addForeignKey('session_id', 'exam_sessions', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('exam_participants');
    }

    public function down()
    {
        $this->forge->dropTable('exam_participants');
    }
}