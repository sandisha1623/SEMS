<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Drop tabel exam domain versi lama (UUID v4 sebagai PK).
 *
 * Kita rebuild dengan pattern dual identifier (integer PK +
 * public_id ULID) di migration berikutnya.
 *
 * down() sengaja kosong — kita tidak ingin "undo" drop ini,
 * karena tabel lama memang ditinggalkan permanen.
 */
class DropLegacyExamTables extends Migration
{
    /**
     * Urutan drop penting karena ada FK cascade.
     * Drop yang paling banyak refer dulu, baru parent-nya.
     */
    private const TABLES_IN_DROP_ORDER = [
        'evidence',
        'violations',
        'exam_participants',
        'face_references',
        'exam_sessions',
    ];

    public function up()
    {
        // Disable FK check sementara biar drop tidak error karena dependency
        $this->db->disableForeignKeyChecks();

        foreach (self::TABLES_IN_DROP_ORDER as $table) {
            if ($this->db->tableExists($table)) {
                $this->forge->dropTable($table, true);
            }
        }

        $this->db->enableForeignKeyChecks();
    }

    public function down()
    {
    }
}