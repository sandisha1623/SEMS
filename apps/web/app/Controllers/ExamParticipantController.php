<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\ExamParticipantModel;
use App\Models\ExamSessionModel;
use App\Models\UserModel;

class ExamParticipantController extends BaseController
{
    protected ExamSessionModel     $sessions;
    protected ExamParticipantModel $participants;
    protected UserModel            $users;

    public function __construct()
    {
        $this->sessions     = new ExamSessionModel();
        $this->participants = new ExamParticipantModel();
        $this->users        = new UserModel();
    }

    /**
     * GET /exam-sessions/{session_public_id}/participants
     */
    public function index(string $sessionPublicId)
    {
        $session = $this->sessions->findByPublicIdOr404($sessionPublicId);

        return view('exam-sessions/participants/index', [
            'pageTitle' => 'Participants',
            'session'   => $session,
            'summary'   => $this->participants->summaryBySession((int) $session['id']),
            'statuses'  => ExamParticipantModel::STATUSES,
        ]);
    }

    /**
     * POST /exam-sessions/{session_public_id}/participants/enroll
     *
     * Body:
     *   user_public_ids[] : array of user public_ids untuk di-enroll
     *
     * Behavior:
     *   - Skip user yang sudah enrolled di session ini (silent)
     *   - Skip user yang role-nya bukan 'student' (silent — defensive)
     *   - Return success_count + skipped_count
     */
    public function enroll(string $sessionPublicId)
    {
        $session   = $this->sessions->findByPublicIdOr404($sessionPublicId);
        $sessionId = (int) $session['id'];

        $publicIds = $this->request->getPost('user_public_ids');

        if (! is_array($publicIds) || empty($publicIds)) {
            return $this->response
                ->setStatusCode(422)
                ->setJSON([
                    'success' => false,
                    'message' => 'Pilih minimal 1 mahasiswa untuk di-enroll.',
                    'csrf'    => $this->csrfMeta(),
                ]);
        }

        // Resolve public_ids → users (filter hanya yang role student & aktif)
        $candidates = $this->users
            ->select('users.id, users.public_id, users.username')
            ->join('roles', 'roles.id = users.role_id')
            ->whereIn('users.public_id', $publicIds)
            ->where('roles.role_slug', 'student')
            ->where('users.is_active', 1)
            ->where('users.deleted_at', null)
            ->findAll();

        if (empty($candidates)) {
            return $this->response
                ->setStatusCode(422)
                ->setJSON([
                    'success' => false,
                    'message' => 'Tidak ada mahasiswa valid untuk di-enroll.',
                    'csrf'    => $this->csrfMeta(),
                ]);
        }

        // Cek mana yang sudah enrolled di session ini
        $candidateUserIds = array_column($candidates, 'id');

        $alreadyEnrolled = $this->participants
            ->select('user_id')
            ->where('session_id', $sessionId)
            ->whereIn('user_id', $candidateUserIds)
            ->findAll();

        $alreadyEnrolledIds = array_column($alreadyEnrolled, 'user_id');

        $toEnroll = array_filter(
            $candidates,
            fn (array $u): bool => ! in_array((int) $u['id'], array_map('intval', $alreadyEnrolledIds), true)
        );

        $successCount = 0;
        $skippedCount = count($candidates) - count($toEnroll);

        foreach ($toEnroll as $user) {
            $inserted = $this->participants->insert([
                'session_id' => $sessionId,
                'user_id'    => (int) $user['id'],
                'status'     => 'enrolled',
            ]);

            if ($inserted) {
                $successCount++;
            }
        }

        $message = sprintf(
            '%d mahasiswa berhasil di-enroll.',
            $successCount
        );
        if ($skippedCount > 0) {
            $message .= sprintf(' %d sudah enrolled (di-skip).', $skippedCount);
        }

        return $this->response->setJSON([
            'success'       => true,
            'message'       => $message,
            'success_count' => $successCount,
            'skipped_count' => $skippedCount,
            'csrf'          => $this->csrfMeta(),
        ]);
    }

    /**
     * POST /exam-sessions/{session_public_id}/participants/{participant_public_id}/status
     */
    public function updateStatus(string $sessionPublicId, string $participantPublicId)
    {
        $session     = $this->sessions->findByPublicIdOr404($sessionPublicId);
        $participant = $this->participants->findByPublicIdOr404($participantPublicId);

        if ((int) $participant['session_id'] !== (int) $session['id']) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON([
                    'success' => false,
                    'message' => 'Participant tidak ditemukan di sesi ini.',
                    'csrf'    => $this->csrfMeta(),
                ]);
        }

        $newStatus = (string) $this->request->getPost('status');

        if (! array_key_exists($newStatus, ExamParticipantModel::STATUSES)) {
            return $this->response
                ->setStatusCode(422)
                ->setJSON([
                    'success' => false,
                    'message' => 'Status tidak valid.',
                    'csrf'    => $this->csrfMeta(),
                ]);
        }

        $data = ['status' => $newStatus];
        $now  = date('Y-m-d H:i:s');

        if ($newStatus === 'in_progress' && empty($participant['started_at'])) {
            $data['started_at'] = $now;
        }
        if ($newStatus === 'submitted' && empty($participant['submitted_at'])) {
            $data['submitted_at'] = $now;
        }

        $ok = $this->participants->updateByPublicId($participantPublicId, $data);

        if (! $ok) {
            return $this->response
                ->setStatusCode(422)
                ->setJSON([
                    'success' => false,
                    'message' => 'Gagal mengubah status.',
                    'errors'  => $this->participants->errors(),
                    'csrf'    => $this->csrfMeta(),
                ]);
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Status berhasil diperbarui ke ' . ExamParticipantModel::STATUSES[$newStatus] . '.',
            'csrf'    => $this->csrfMeta(),
        ]);
    }

    /**
     * POST /exam-sessions/{session_public_id}/participants/{participant_public_id}/delete
     */
    public function delete(string $sessionPublicId, string $participantPublicId)
    {
        $session     = $this->sessions->findByPublicIdOr404($sessionPublicId);
        $participant = $this->participants->findByPublicIdOr404($participantPublicId);

        if ((int) $participant['session_id'] !== (int) $session['id']) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON([
                    'success' => false,
                    'message' => 'Participant tidak ditemukan di sesi ini.',
                    'csrf'    => $this->csrfMeta(),
                ]);
        }

        $this->participants->delete($participant['id']);

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Participant berhasil dihapus dari sesi.',
            'csrf'    => $this->csrfMeta(),
        ]);
    }

    protected function csrfMeta(): array
    {
        return ['name' => csrf_token(), 'hash' => csrf_hash()];
    }
}