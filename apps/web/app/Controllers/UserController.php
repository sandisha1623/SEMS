<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\DepartmentModel;
use App\Models\UserModel;

class UserController extends BaseController
{
    protected UserModel       $model;
    protected DepartmentModel $departments;

    public function __construct()
    {
        $this->model       = new UserModel();
        $this->departments = new DepartmentModel();
    }

    public function index()
    {
        return view('users/index', [
            'pageTitle'   => 'Manajemen Pengguna',
            'summary'     => $this->summary(),
            'rolesForFilter' => $this->rolesForFilter(),
            'rolesForForm'   => $this->rolesForForm(),
        ]);
    }

    public function create()
    {
        return view('users/create', [
            'pageTitle'   => 'New User',
            'user'        => $this->blankUser(),
            'roles'       => $this->rolesForForm(),
            'departments' => $this->departments->dropdownOptions(),
        ]);
    }

    public function store()
    {
        $data = $this->extractFormData();

        $conditionalErrors = $this->model->validateConditional($data);
        if (! empty($conditionalErrors)) {
            return $this->validationErrorResponse($conditionalErrors);
        }

        $password = trim((string) $this->request->getPost('password'));
        if ($password === '') {
            return $this->validationErrorResponse([
                'password' => 'Password wajib diisi untuk user baru.',
            ]);
        }
        if (strlen($password) < 8) {
            return $this->validationErrorResponse([
                'password' => 'Password minimal 8 karakter.',
            ]);
        }
        $data['password_hash'] = password_hash($password, PASSWORD_ARGON2ID);

        if (! $this->model->insert($data)) {
            return $this->validationErrorResponse(
                $this->model->errors()
            );
        }

        return $this->response->setJSON([
            'success'  => true,
            'message'  => 'User berhasil dibuat.',
            'redirect' => '/users',
            'csrf'     => $this->csrfMeta(),
        ]);
    }

    public function edit(string $publicId)
    {
        $user = $this->model->findByPublicIdOr404($publicId);

        return view('users/edit', [
            'pageTitle'   => 'Edit User',
            'user'        => $user,
            'roles'       => $this->rolesForForm(),
            'departments' => $this->departments->dropdownOptions(),
        ]);
    }

    public function update(string $publicId)
    {
        $data = $this->extractFormData();

        $conditionalErrors = $this->model->validateConditional($data);
        if (! empty($conditionalErrors)) {
            return $this->validationErrorResponse($conditionalErrors);
        }

        $password = trim((string) $this->request->getPost('password'));
        if ($password !== '') {
            if (strlen($password) < 8) {
                return $this->validationErrorResponse([
                    'password' => 'Password minimal 8 karakter.',
                ]);
            }
            $data['password_hash'] = password_hash($password, PASSWORD_ARGON2ID);
        }

        $ok = $this->model->updateByPublicId($publicId, $data);

        if (! $ok) {
            if (! $this->model->findByPublicId($publicId)) {
                throw \CodeIgniter\Exceptions\PageNotFoundException::forPageNotFound();
            }
            return $this->validationErrorResponse(
                $this->model->errors()
            );
        }

        return $this->response->setJSON([
            'success'  => true,
            'message'  => 'User berhasil diperbarui.',
            'redirect' => '/users',
            'csrf'     => $this->csrfMeta(),
        ]);
    }

    public function delete(string $publicId)
    {
        $row = $this->model->findByPublicIdOr404($publicId);

        if ((int) $row['id'] === (int) session('user.id')) {
            return $this->response
                ->setStatusCode(403)
                ->setJSON([
                    'success' => false,
                    'message' => 'Anda tidak dapat menghapus akun sendiri.',
                    'csrf'    => $this->csrfMeta(),
                ]);
        }

        $this->model->delete($row['id']);

        return $this->response->setJSON([
            'success' => true,
            'message' => 'User berhasil dihapus.',
            'csrf'    => $this->csrfMeta(),
        ]);
    }

    /* ----------------------------------------------------------
     | Helpers
     * --------------------------------------------------------*/

    protected function extractFormData(): array
    {
        return [
            'username'      => trim((string) $this->request->getPost('username')),
            'email'         => trim((string) $this->request->getPost('email')),
            'full_name'     => $this->request->getPost('full_name') ?: null,
            'role_id'       => (int) $this->request->getPost('role_id'),
            'department_id' => $this->request->getPost('department_id') ?: null,
            'is_active'     => $this->request->getPost('is_active') ? 1 : 0,
        ];
    }

    protected function blankUser(): array
    {
        return [
            'public_id'     => null,
            'username'      => '',
            'email'         => '',
            'full_name'     => '',
            'role_id'       => null,
            'department_id' => null,
            'is_active'     => 1,
        ];
    }

    /**
     * Untuk dropdown form: pakai ID karena yang disimpan ke DB
     * adalah users.role_id (integer).
     *
     * Return: [id => name]
     */
    protected function rolesForForm(): array
    {
        $rows = $this->model->db
            ->table('roles')
            ->select('id, role_name')
            ->orderBy('role_name', 'ASC')
            ->get()
            ->getResultArray();

        $out = [];
        foreach ($rows as $row) {
            $out[$row['id']] = $row['role_name'];
        }
        return $out;
    }

    /**
     * Untuk dropdown filter di list page: pakai slug supaya
     * stabil terhadap re-seed (id bisa berubah, slug tidak).
     *
     * Return: [slug => name]
     */
    protected function rolesForFilter(): array
    {
        $rows = $this->model->db
            ->table('roles')
            ->select('role_slug, role_name')
            ->orderBy('role_name', 'ASC')
            ->get()
            ->getResultArray();

        $out = [];
        foreach ($rows as $row) {
            $out[$row['role_slug']] = $row['role_name'];
        }
        return $out;
    }

    protected function summary(): array
    {
        $total    = $this->model->countAllResults();
        $active   = $this->model->where('is_active', 1)->countAllResults();
        $students = (new UserModel())->totalStudents();

        return [
            'total'    => $total,
            'active'   => $active,
            'students' => $students,
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