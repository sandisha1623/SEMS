<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAuthSessions extends Migration
{
    public function up()
    {
        $this->forge->addField([

            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true,
            ],

            'user_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],

            'refresh_token' => [
                'type' => 'TEXT',
            ],

            'device_name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],

            'ip_address' => [
                'type' => 'VARCHAR',
                'constraint' => 45,
            ],

            'user_agent' => [
                'type' => 'TEXT',
                'null' => true,
            ],

            'expires_at' => [
                'type' => 'DATETIME',
            ],

            'revoked_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],

            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],

            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);

        $this->forge->createTable('auth_sessions');
    }

    public function down()
    {
        $this->forge->dropTable('auth_sessions');
    }
}