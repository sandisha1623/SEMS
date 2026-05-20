<?php

namespace App\Database\Migrations;

use App\Libraries\Ulid;
use CodeIgniter\Database\Migration;

/**
 * Tambah kolom public_id (ULID dengan prefix) ke tabel existing
 * yang mungkin di-ekspos ke URL/API publik.
 *
 * Tabel yang di-include:
 *   - users        (usr_*)
 *   - roles        (rol_*)
 *   - permissions  (prm_*)
 *
 * Tabel internal-only (session_logs, refresh_tokens, notifications)
 * tidak diberi public_id — mereka tidak pernah diekspos ke client.
 *
 * Untuk row existing, public_id di-backfill di migration ini.
 */
class AddPublicIdToExistingTables extends Migration
{
    private const TARGETS = [
        'users'       => 'usr',
        'roles'       => 'rol',
        'permissions' => 'prm',
    ];

    public function up()
    {
        foreach (self::TARGETS as $table => $prefix) {
            $this->addColumn($table);
            $this->backfill($table, $prefix);
            $this->addUniqueIndex($table);
        }
    }

    public function down()
    {
        foreach (array_keys(self::TARGETS) as $table) {
            if ($this->db->fieldExists('public_id', $table)) {
                $this->forge->dropColumn($table, 'public_id');
            }
        }
    }

    /**
     * Tambah kolom — nullable dulu supaya backfill bisa jalan.
     */
    private function addColumn(string $table): void
    {
        if ($this->db->fieldExists('public_id', $table)) {
            return;
        }

        $this->forge->addColumn($table, [
            'public_id' => [
                'type'       => 'CHAR',
                'constraint' => 30,
                'null'       => true,
                'after'      => 'id',
                'comment'    => 'ULID dengan prefix, untuk URL/API. Format: <prefix>_<26 char>',
            ],
        ]);
    }

    /**
     * Isi public_id untuk semua row existing.
     */
    private function backfill(string $table, string $prefix): void
    {
        $rows = $this->db->table($table)
            ->select('id')
            ->where('public_id', null)
            ->get()
            ->getResultArray();

        foreach ($rows as $row) {
            $this->db->table($table)
                ->where('id', $row['id'])
                ->update(['public_id' => Ulid::generateWithPrefix($prefix)]);
        }
    }

    /**
     * Setelah backfill, tambah UNIQUE constraint dan jadikan NOT NULL.
     */
    private function addUniqueIndex(string $table): void
    {
        $this->db->query(
            "ALTER TABLE `{$this->db->prefixTable($table)}` "
            . "MODIFY `public_id` CHAR(30) NOT NULL"
        );

        $this->forge->addKey('public_id', false, true, "{$table}_public_id_unique");
        $this->db->query(
            "ALTER TABLE `{$this->db->prefixTable($table)}` "
            . "ADD UNIQUE KEY `{$this->db->DBPrefix}{$table}_public_id_unique` (`public_id`)"
        );
    }
}