<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\DepartmentModel;
use App\Models\ExamSessionModel;

class ExamSessionController extends BaseController
{
    protected ExamSessionModel $model;
    protected DepartmentModel  $departments;

    private const DEFAULT_SETTINGS = [
        'alert_sensitivity' => 'medium',
        'face_recognition'  => true,
        'gaze_tracking'     => true,
        'browser_lockdown'  => true,
        'object_detection'  => false,
    ];

    public function __construct()
    {
        $this->model       = new ExamSessionModel();
        $this->departments = new DepartmentModel();
    }

    public function index()
    {
        return view('exam-sessions/index', [
            'pageTitle' => 'Exam Sessions',
            'summary'   => $this->summary(),
        ]);
    }

    public function create()
    {
        return view('exam-sessions/create', [
            'pageTitle'   => 'Configure New Exam Session',
            'session'     => $this->blankSession(),
            'departments' => $this->departments->dropdownOptions(),
            'timezones'   => $this->timezoneOptions(),
        ]);
    }

    public function store()
    {
        $data = $this->extractFormData();
        $data['created_by'] = session('user.id');

        if (! $this->model->insert($data)) {
            return $this->validationErrorResponse(
                $this->model->errors()
            );
        }

        // Tentukan redirect berdasarkan action tombol yang di-click.
        // Default ke 'manage_participants' (primary button) supaya
        // alur kerja paling umum di-default-kan.
        $action = $this->request->getPost('_action') ?: 'manage_participants';

        if ($action === 'list') {
            $redirect = '/exam-sessions';
            $message  = 'Exam session berhasil dibuat.';
        } else {
            // Cari row yang baru dibuat (untuk ambil public_id)
            $newSession = $this->model
                ->where('code', $data['code'])
                ->first();

            $redirect = '/exam-sessions/' . $newSession['public_id'] . '/participants';
            $message  = 'Exam session berhasil dibuat. Lanjut atur peserta.';
        }

        return $this->response->setJSON([
            'success'  => true,
            'message'  => $message,
            'redirect' => $redirect,
            'csrf'     => $this->csrfMeta(),
        ]);
    }

    public function edit(string $publicId)
    {
        $session = $this->model->findByPublicIdOr404($publicId);

        if (! empty($session['settings']) && is_string($session['settings'])) {
            $session['settings'] = json_decode($session['settings'], true) ?? [];
        } elseif (empty($session['settings'])) {
            $session['settings'] = [];
        }

        $session['settings'] = array_merge(
            self::DEFAULT_SETTINGS,
            $session['settings']
        );

        return view('exam-sessions/edit', [
            'pageTitle'   => 'Edit Exam Session',
            'session'     => $session,
            'departments' => $this->departments->dropdownOptions(),
            'timezones'   => $this->timezoneOptions(),
        ]);
    }

    public function update(string $publicId)
    {
        $data = $this->extractFormData();
        unset($data['created_by']);

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
            'message'  => 'Exam session berhasil diperbarui.',
            'redirect' => '/exam-sessions',
            'csrf'     => $this->csrfMeta(),
        ]);
    }

    public function delete(string $publicId)
    {
        $row = $this->model->findByPublicIdOr404($publicId);
        $this->model->delete($row['id']);

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Exam session berhasil dihapus.',
            'csrf'    => $this->csrfMeta(),
        ]);
    }

    /* ----------------------------------------------------------
     | Data helpers
     * --------------------------------------------------------*/

    protected function extractFormData(): array
    {
        $startsAt = (string) $this->request->getPost('starts_at');
        $duration = (int) $this->request->getPost('duration_minutes');

        $endsAt = '';
        if ($startsAt !== '' && $duration > 0) {
            $endsAt = date(
                'Y-m-d H:i:s',
                strtotime($startsAt) + $duration * 60
            );
        }

        return [
            'code'             => trim((string) $this->request->getPost('code')),
            'title'            => trim((string) $this->request->getPost('title')),
            'description'      => $this->request->getPost('description') ?: null,
            'department_id'    => $this->request->getPost('department_id') ?: null,
            'mode'             => $this->request->getPost('mode') ?: 'online',
            'starts_at'        => $startsAt,
            'ends_at'          => $endsAt,
            'timezone'         => $this->request->getPost('timezone') ?: 'Asia/Jakarta',
            'duration_minutes' => $duration,
            'status'           => $this->request->getPost('status') ?: 'draft',
            'settings'         => $this->extractSettings(),
        ];
    }

    protected function extractSettings(): array
    {
        $sensitivity = $this->request->getPost('alert_sensitivity') ?: 'medium';
        if (! in_array($sensitivity, ['low', 'medium', 'high'], true)) {
            $sensitivity = 'medium';
        }

        return [
            'alert_sensitivity' => $sensitivity,
            'face_recognition'  => (bool) $this->request->getPost('face_recognition'),
            'gaze_tracking'     => (bool) $this->request->getPost('gaze_tracking'),
            'browser_lockdown'  => (bool) $this->request->getPost('browser_lockdown'),
            'object_detection'  => (bool) $this->request->getPost('object_detection'),
        ];
    }

    protected function blankSession(): array
    {
        return [
            'public_id'        => null,
            'code'             => '',
            'title'            => '',
            'description'      => '',
            'department_id'    => null,
            'mode'             => 'online',
            'starts_at'        => date('Y-m-d\TH:i', strtotime('+1 hour')),
            'ends_at'          => '',
            'timezone'         => 'Asia/Jakarta',
            'duration_minutes' => 120,
            'status'           => 'draft',
            'settings'         => self::DEFAULT_SETTINGS,
        ];
    }

    protected function timezoneOptions(): array
    {
        return [
            'Asia/Jakarta'  => 'WIB (Asia/Jakarta) UTC+7',
            'Asia/Makassar' => 'WITA (Asia/Makassar) UTC+8',
            'Asia/Jayapura' => 'WIT (Asia/Jayapura) UTC+9',
            'UTC'           => 'UTC',
        ];
    }

    protected function summary(): array
    {
        return [
            'total_sessions' => $this->model->countAll(),
            'scheduled'      => $this->model->where('status', 'scheduled')->countAllResults(),
            'ongoing'        => $this->model->where('status', 'ongoing')->countAllResults(),
            'completed'      => $this->model->where('status', 'completed')->countAllResults(),
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