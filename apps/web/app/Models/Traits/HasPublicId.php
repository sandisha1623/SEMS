<?php

namespace App\Models\Traits;

use App\Libraries\Ulid;

/**
 * Trait untuk model dengan dual identifier:
 *   - id        (BIGINT, primary key, internal use only)
 *   - public_id (CHAR(30), eksposable ke URL/API)
 *
 * Otomatis generate public_id saat insert berdasarkan tabel
 * (lewat Ulid::PREFIX_MAP). Model yang pakai trait ini wajib
 * punya property $publicIdPrefix dan masukkan callback ke
 * $beforeInsert:
 *
 *   class ExamSessionModel extends Model
 *   {
 *       use HasPublicId;
 *
 *       protected $publicIdPrefix = 'exm';
 *       protected $beforeInsert  = ['setPublicIdBeforeInsert'];
 *       // ...
 *   }
 *
 * Helper:
 *   - findByPublicId($publicId)        : cari, return null kalau tidak ada
 *   - findByPublicIdOr404($publicId)   : cari, throw 404 kalau tidak ada
 *   - updateByPublicId($publicId, $data) : update dengan placeholder {id} aman
 */
trait HasPublicId
{
    /**
     * Auto-fill public_id saat insert kalau belum di-set.
     */
    protected function setPublicIdBeforeInsert(array $data): array
    {
        if (! isset($this->publicIdPrefix)) {
            return $data;
        }

        if (empty($data['data']['public_id'])) {
            $data['data']['public_id'] = Ulid::generateWithPrefix(
                $this->publicIdPrefix
            );
        }

        return $data;
    }

    /**
     * Cari record berdasarkan public_id (untuk route binding).
     */
    public function findByPublicId(string $publicId)
    {
        if (! Ulid::isValid($publicId)) {
            return null;
        }

        return $this->where('public_id', $publicId)->first();
    }

    /**
     * Cari ATAU lempar 404. Convenience untuk controller.
     */
    public function findByPublicIdOr404(string $publicId)
    {
        $row = $this->findByPublicId($publicId);

        if ($row === null) {
            throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound();
        }

        return $row;
    }

    /**
     * Update record berdasarkan public_id.
     *
     * Otomatis inject `id` ke data supaya placeholder {id} di rule
     * is_unique[...,id,{id}] ter-resolve dengan benar. Pakai method ini
     * (bukan ->update()) di controller untuk hindari bug "uniqueness
     * triggered against itself" dan "No validation rules for placeholder".
     *
     *   // Di controller:
     *   $row = $this->model->findByPublicIdOr404($publicId);
     *   $ok  = $this->model->updateByPublicId($publicId, $data);
     *
     *   if (! $ok) {
     *       return $this->validationErrorResponse($this->model->errors());
     *   }
     */
    public function updateByPublicId(string $publicId, array $data): bool
    {
        $row = $this->findByPublicId($publicId);

        if ($row === null) {
            return false;
        }

        $data['id'] = $row[$this->primaryKey];

        return $this->update($row[$this->primaryKey], $data);
    }
}