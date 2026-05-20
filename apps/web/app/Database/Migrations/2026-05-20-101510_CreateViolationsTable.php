<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateViolationsTable extends Migration
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
                'comment'    => 'vio_<ULID>',
            ],
            'participant_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'type' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'comment'    => 'face_missing, multi_face, identity_mismatch, head_turn, object_detected, audio_voice',
            ],
            'severity' => [
                'type'       => 'ENUM',
                'constraint' => ['low', 'medium', 'high', 'critical'],
                'default'    => 'medium',
            ],
            'confidence' => [
                'type'       => 'DECIMAL',
                'constraint' => '5,4',
                'null'       => true,
            ],
            'metadata' => [
                'type'    => 'JSON',
                'null'    => true,
                'comment' => 'Bounding box, head pose, dst',
            ],
            'occurred_at' => ['type' => 'DATETIME'],
            'reviewed_at' => ['type' => 'DATETIME', 'null' => true],
            'reviewed_by' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
                'null'       => true,
            ],
            'review_status' => [
                'type'       => 'ENUM',
                'constraint' => ['pending', 'confirmed', 'dismissed', 'false_positive'],
                'default'    => 'pending',
            ],
            'review_note' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('public_id');
        $this->forge->addKey('participant_id');
        $this->forge->addKey('type');
        $this->forge->addKey('severity');
        $this->forge->addKey('review_status');
        $this->forge->addKey('occurred_at');

        $this->forge->addForeignKey('participant_id', 'exam_participants', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('reviewed_by', 'users', 'id', 'SET NULL', 'CASCADE');

        $this->forge->createTable('violations');
    }

    public function down()
    {
        $this->forge->dropTable('violations');
    }
}