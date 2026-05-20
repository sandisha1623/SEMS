<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateFaceReferencesTable extends Migration
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
                'comment'    => 'frf_<ULID>',
            ],
            'user_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'file_path' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'comment'    => 'Relatif terhadap writable/uploads/face-references/',
            ],
            'file_hash' => [
                'type'       => 'CHAR',
                'constraint' => 64,
                'null'       => true,
                'comment'    => 'SHA-256 untuk deteksi duplikat',
            ],
            'mime_type' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'null'       => true,
            ],
            'embedding' => [
                'type'    => 'JSON',
                'null'    => true,
                'comment' => 'Vector embedding hasil DeepFace (cache)',
            ],
            'embedding_model' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'null'       => true,
                'comment'    => 'Mis. Facenet512, ArcFace',
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['active', 'archived', 'rejected'],
                'default'    => 'active',
            ],
            'note' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'uploaded_by' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
                'null'       => true,
            ],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('public_id');
        $this->forge->addKey('user_id');
        $this->forge->addKey('status');

        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('uploaded_by', 'users', 'id', 'SET NULL', 'CASCADE');

        $this->forge->createTable('face_references');
    }

    public function down()
    {
        $this->forge->dropTable('face_references');
    }
}