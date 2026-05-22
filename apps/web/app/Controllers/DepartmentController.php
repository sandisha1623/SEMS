<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\DepartmentModel;

class DepartmentController extends BaseController
{
    protected DepartmentModel $model;

    public function __construct()
    {
        $this->model = new DepartmentModel();
    }

    public function index()
    {
        return view('departments/index', [
            'pageTitle' => 'Manajemen Departemen',
            'summary'   => $this->model->summary(),
        ]);
    }

    public function create()
    {
        return view('departments/create', [
            'pageTitle'  => 'New Department',
            'department' => $this->blankDepartment(),
        ]);
    }

    public function store()
    {
        $data = $this->extractFormData();

        if (! $this->model->insert($data)) {
            return $this->validationErrorResponse(
                $this->model->errors()
            );
        }

        return $this->response->setJSON([
            'success'  => true,
            'message'  => 'Department berhasil dibuat.',
            'redirect' => '/departments',
            'csrf'     => $this->csrfMeta(),
        ]);
    }

    public function edit(string $publicId)
    {
        $department = $this->model->findByPublicIdOr404($publicId);

        return view('departments/edit', [
            'pageTitle'  => 'Edit Department',
            'department' => $department,
        ]);
    }

    public function update(string $publicId)
    {
        // Pakai helper updateByPublicId() — otomatis inject id ke data
        // supaya placeholder {id} di rule is_unique ter-resolve.
        $ok = $this->model->updateByPublicId(
            $publicId,
            $this->extractFormData()
        );

        if (! $ok) {
            // Bisa karena record tidak ada (404) atau validation gagal
            if (! $this->model->findByPublicId($publicId)) {
                throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound();
            }

            return $this->validationErrorResponse(
                $this->model->errors()
            );
        }

        return $this->response->setJSON([
            'success'  => true,
            'message'  => 'Department berhasil diperbarui.',
            'redirect' => '/departments',
            'csrf'     => $this->csrfMeta(),
        ]);
    }

    public function delete(string $publicId)
    {
        $row = $this->model->findByPublicIdOr404($publicId);

        $this->model->delete($row['id']);

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Department berhasil dihapus.',
            'csrf'    => $this->csrfMeta(),
        ]);
    }

    /* ----------------------------------------------------------
     | Helpers
     * --------------------------------------------------------*/

    protected function extractFormData(): array
    {
        return [
            'name'        => trim((string) $this->request->getPost('name')),
            'code'        => strtoupper(trim((string) $this->request->getPost('code'))),
            'faculty'     => $this->request->getPost('faculty')   ?: null,
            'head_name'   => $this->request->getPost('head_name') ?: null,
            'icon'        => $this->request->getPost('icon')      ?: 'domain',
            'description' => $this->request->getPost('description') ?: null,
            'is_active'   => $this->request->getPost('is_active') ? 1 : 0,
        ];
    }

    protected function blankDepartment(): array
    {
        return [
            'public_id'   => null,
            'name'        => '',
            'faculty'     => '',
            'head_name'   => '',
            'icon'        => 'domain',
            'code'        => '',
            'description' => '',
            'is_active'   => 1,
        ];
    }

    protected function validationErrorResponse(array $errors)
    {
        return $this->response
            ->setStatusCode(422)
            ->setJSON([
                'success' => false,
                'message' => 'Data tidak valid. Periksa kembali isian.',
                'errors'  => $errors,
                'csrf'    => $this->csrfMeta(),
            ]);
    }

    protected function csrfMeta(): array
    {
        return ['name' => csrf_token(), 'hash' => csrf_hash()];
    }
}