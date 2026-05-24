<?php
// $departmentsForEnroll dipass dari controller untuk dropdown filter modal
$departmentsForEnroll = (new \App\Models\DepartmentModel())->dropdownOptions();
?>
<?= $this->extend('layout/main') ?>

<?= $this->section('title') ?>Participants — <?= esc($session['code']) ?><?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css">
<style>
    .stats-card {
        background: #fff;
        border: 1px solid #eef0f3;
        border-radius: 8px;
        padding: 1.25rem 1.5rem;
    }
    .stats-card .stats-label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6c757d;
        margin-bottom: 0.5rem;
    }
    .stats-card .stats-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
        line-height: 1;
    }

    .session-info-card {
        background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
        border: 1px solid #e0e7ff;
        border-radius: 10px;
        padding: 1.25rem 1.5rem;
    }
    .session-info-card .session-code {
        font-family: monospace;
        font-size: 0.75rem;
        font-weight: 600;
        color: #4f46e5;
        background: white;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 0.5rem;
    }

    .user-cell { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar {
        width: 36px; height: 36px; border-radius: 50%;
        background: #eef2ff; color: #4f46e5;
        display: flex; align-items: center; justify-content: center;
        font-weight: 600; font-size: 0.85rem; flex-shrink: 0;
    }
    .user-name  { font-weight: 600; color: #1f2937; line-height: 1.2; }
    .user-email { font-size: 0.75rem; color: #6c757d; }

    .dept-cell { display: flex; align-items: center; gap: 0.5rem; }
    .dept-icon-sm {
        width: 24px; height: 24px; border-radius: 5px;
        background: #eef2ff; color: #4f46e5;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.85rem;
    }

    .status-pill {
        font-size: 0.7rem; font-weight: 600;
        padding: 0.25rem 0.75rem; border-radius: 12px;
        text-transform: uppercase; letter-spacing: 0.05em;
    }
    .status-pill.secondary { background: #f3f4f6; color: #6b7280; }
    .status-pill.info      { background: #dbeafe; color: #1e40af; }
    .status-pill.warning   { background: #fef3c7; color: #92400e; }
    .status-pill.success   { background: #ecfdf5; color: #047857; }
    .status-pill.danger    { background: #fee2e2; color: #b91c1c; }
    .status-pill.dark      { background: #1f2937; color: #f3f4f6; }

    /* Modal enrollment styles */
    #enrollModal .modal-dialog { max-width: 720px; }
    #enrollModal .search-results {
        max-height: 360px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: white;
    }
    #enrollModal .search-result-item {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f3f4f6;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition: background-color 0.1s;
    }
    #enrollModal .search-result-item:last-child { border-bottom: none; }
    #enrollModal .search-result-item:hover { background: #f9fafb; }
    #enrollModal .search-result-item.selected { background: #eef2ff; }

    #enrollModal .search-loading, #enrollModal .search-empty {
        padding: 2rem 1rem;
        text-align: center;
        color: #6b7280;
    }
</style>
<?= $this->endSection() ?>

<?= $this->section('content') ?>

<div class="container-fluid">

    <div class="d-flex justify-content-between align-items-start mb-4">
        <div>
            <div class="small text-muted mb-1">
                <a href="<?= base_url('exam-sessions') ?>" class="text-muted text-decoration-none">
                    Exam Sessions
                </a>
                <span class="mx-1">›</span>
                <a href="<?= base_url('exam-sessions/' . $session['public_id'] . '/edit') ?>"
                   class="text-muted text-decoration-none">
                    <?= esc($session['code']) ?>
                </a>
                <span class="mx-1">›</span>
                <span class="text-primary">Participants</span>
            </div>
            <h3 class="mb-0">Manage Participants</h3>
        </div>
        <div class="d-flex gap-2">
            <button type="button" class="btn btn-primary" id="btnEnroll"
                    data-bs-toggle="modal" data-bs-target="#enrollModal">
                <i class="mdi mdi-account-plus me-1"></i> Enroll Students
            </button>
        </div>
    </div>

    <div class="session-info-card mb-4">
        <div class="row align-items-center">
            <div class="col-md-7">
                <span class="session-code"><?= esc($session['code']) ?></span>
                <h5 class="mb-1"><?= esc($session['title']) ?></h5>
                <div class="small text-muted">
                    <i class="mdi mdi-clock-outline me-1"></i>
                    <?= esc(date('d M Y · H:i', strtotime($session['starts_at']))) ?>
                    · Durasi <?= esc($session['duration_minutes']) ?> menit
                    · Mode <?= esc($session['mode']) ?>
                </div>
            </div>
            <div class="col-md-5 text-md-end">
                <a href="<?= base_url('exam-sessions/' . $session['public_id'] . '/edit') ?>"
                   class="btn btn-sm btn-light">
                    <i class="mdi mdi-cog-outline me-1"></i> Configure Session
                </a>
            </div>
        </div>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-md-3">
            <div class="stats-card">
                <div class="stats-label">Total Enrolled</div>
                <div class="stats-value"><?= esc($summary['total']) ?></div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card">
                <div class="stats-label">Verified</div>
                <div class="stats-value text-info"><?= esc($summary['verified']) ?></div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card">
                <div class="stats-label">In Progress</div>
                <div class="stats-value text-warning"><?= esc($summary['in_progress']) ?></div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card">
                <div class="stats-label">Submitted</div>
                <div class="stats-value text-success"><?= esc($summary['submitted']) ?></div>
            </div>
        </div>
    </div>

    <?php if (session()->getFlashdata('success')): ?>
        <div class="alert alert-success"><?= session()->getFlashdata('success') ?></div>
    <?php endif; ?>

    <div id="alertBox" class="alert d-none"></div>

    <div class="card">
        <div class="card-header bg-white py-3">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 class="mb-0">Daftar Peserta</h5>
                <select id="statusFilter" class="form-select form-select-sm" style="min-width: 180px;">
                    <option value="">Semua Status</option>
                    <?php foreach ($statuses as $val => $label): ?>
                        <option value="<?= esc($val) ?>"><?= esc($label) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>
        <div class="card-body">
            <table id="participantsTable" class="table table-hover align-middle" style="width:100%">
                <thead>
                    <tr>
                        <th>Mahasiswa</th>
                        <th>Department</th>
                        <th class="text-center">Status</th>
                        <th class="text-center">Verification</th>
                        <th>Enrolled At</th>
                        <th class="text-end">Aksi</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>

</div>

<!-- ====================================================== -->
<!-- Modal: Change Status                                    -->
<!-- ====================================================== -->
<div class="modal fade" id="statusModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Ubah Status Peserta</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3 small text-muted">
                    <strong id="statusModalUser">—</strong>
                </div>
                <label class="form-label">Status Baru</label>
                <select id="statusModalSelect" class="form-select">
                    <?php foreach ($statuses as $val => $label): ?>
                        <option value="<?= esc($val) ?>"><?= esc($label) ?></option>
                    <?php endforeach; ?>
                </select>
                <small class="text-muted mt-2 d-block">
                    Mengubah ke <strong>In Progress</strong> akan mengisi <code>started_at</code> otomatis.
                    Ke <strong>Submitted</strong> akan mengisi <code>submitted_at</code>.
                </small>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="statusModalSave">
                    <span id="statusModalSpinner" class="spinner-border spinner-border-sm d-none"></span>
                    Simpan
                </button>
            </div>
        </div>
    </div>
</div>

<!-- ====================================================== -->
<!-- Modal: Enroll Students                                  -->
<!-- ====================================================== -->
<div class="modal fade" id="enrollModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    <i class="mdi mdi-account-plus me-2"></i>
                    Enroll Students
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">

                <!-- Tabs -->
                <ul class="nav nav-tabs nav-bordered mb-3" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" data-bs-toggle="tab" href="#tabSingle" role="tab">
                            <i class="mdi mdi-account-plus me-1"></i>
                            Single Enroll
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#tabBulk" role="tab">
                            <i class="mdi mdi-account-multiple-plus me-1"></i>
                            Bulk Enroll
                        </a>
                    </li>
                </ul>

                <div class="tab-content">

                    <!-- TAB: Single -->
                    <div class="tab-pane show active" id="tabSingle" role="tabpanel">
                        <div class="row g-2 mb-3">
                            <div class="col-md-7">
                                <input type="search" id="singleSearch" class="form-control"
                                       placeholder="Cari nama, username, atau email...">
                            </div>
                            <div class="col-md-5">
                                <select id="singleDeptFilter" class="form-select">
                                    <option value="">Semua Department</option>
                                    <?php foreach ($departmentsForEnroll as $id => $name): ?>
                                        <option value="<?= esc($id) ?>"><?= esc($name) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>

                        <div class="search-results" id="singleResults">
                            <div class="search-empty">
                                <i class="mdi mdi-magnify fs-3 d-block mb-2"></i>
                                Ketik di kolom search untuk mencari mahasiswa.
                            </div>
                        </div>

                        <small class="text-muted mt-2 d-block">
                            Klik baris untuk langsung enroll. Hanya menampilkan mahasiswa yang
                            belum enrolled di sesi ini.
                        </small>
                    </div>

                    <!-- TAB: Bulk -->
                    <div class="tab-pane" id="tabBulk" role="tabpanel">
                        <div class="row g-2 mb-3">
                            <div class="col-md-7">
                                <input type="search" id="bulkSearch" class="form-control"
                                       placeholder="Cari nama, username, atau email...">
                            </div>
                            <div class="col-md-5">
                                <select id="bulkDeptFilter" class="form-select">
                                    <option value="">Semua Department</option>
                                    <?php foreach ($departmentsForEnroll as $id => $name): ?>
                                        <option value="<?= esc($id) ?>"><?= esc($name) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <button type="button" class="btn btn-sm btn-light" id="bulkSelectAll">
                                <i class="mdi mdi-checkbox-multiple-marked-outline me-1"></i>
                                Select All Visible
                            </button>
                            <small class="text-muted">
                                <span id="bulkSelectedCount">0</span> selected
                            </small>
                        </div>

                        <div class="search-results" id="bulkResults">
                            <div class="search-empty">
                                <i class="mdi mdi-magnify fs-3 d-block mb-2"></i>
                                Ketik di kolom search atau pilih department untuk mulai.
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="bulkEnrollBtn" disabled>
                    <span id="bulkEnrollSpinner" class="spinner-border spinner-border-sm d-none"></span>
                    Enroll Selected (<span id="bulkEnrollCount">0</span>)
                </button>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<meta name="csrf-token" content="<?= csrf_hash() ?>">
<meta name="session-public-id" content="<?= esc($session['public_id']) ?>">

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= base_url('assets/js/pages/participants-list.js') ?>"></script>
<script src="<?= base_url('assets/js/pages/participants-enroll.js') ?>"></script>
<?= $this->endSection() ?>