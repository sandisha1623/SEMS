<?= $this->extend('layout/main') ?>

<?= $this->section('title') ?><?= esc($pageTitle) ?><?= $this->endSection() ?>

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

    .exam-title-cell { line-height: 1.3; }
    .exam-title      { font-weight: 600; color: #1f2937; }
    .exam-code       { font-size: 0.7rem; color: #6c757d; }

    .dept-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .dept-icon-sm {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: #eef2ff;
        color: #4f46e5;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.95rem;
        flex-shrink: 0;
    }

    .status-pill {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .status-pill.secondary { background: #f3f4f6; color: #6b7280; }
    .status-pill.info      { background: #dbeafe; color: #1e40af; }
    .status-pill.warning   { background: #fef3c7; color: #92400e; }
    .status-pill.success   { background: #ecfdf5; color: #047857; }
    .status-pill.danger    { background: #fee2e2; color: #b91c1c; }
</style>
<?= $this->endSection() ?>

<?= $this->section('content') ?>

<div class="container-fluid">

    <!-- Breadcrumb + title -->
    <div class="py-3 d-flex align-items-sm-center flex-sm-row flex-column">
        <div class="flex-grow-1">
            <h4 class="fs-18 fw-semibold m-0"><?= esc($pageTitle) ?></h4>
        </div>

        <div class="text-end">
            <ol class="breadcrumb m-0 py-0">
                <li class="breadcrumb-item"><a href="javascript: void(0);">Tables</a></li>
                <li class="breadcrumb-item active">Basic Tables</li>
            </ol>
        </div>
    </div>

    <!-- Stats panel -->
    <div class="row g-3 mb-4">
        <div class="col-md-3">
            <div class="stats-card">
                <div class="stats-label">Total Sessions</div>
                <div class="stats-value"><?= esc($summary['total_sessions']) ?></div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card">
                <div class="stats-label">Scheduled</div>
                <div class="stats-value text-info"><?= esc($summary['scheduled']) ?></div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card">
                <div class="stats-label">Ongoing</div>
                <div class="stats-value text-warning"><?= esc($summary['ongoing']) ?></div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card">
                <div class="stats-label">Completed</div>
                <div class="stats-value text-success"><?= esc($summary['completed']) ?></div>
            </div>
        </div>
    </div>

    <?php if (session()->getFlashdata('success')): ?>
        <div class="alert alert-success"><?= session()->getFlashdata('success') ?></div>
    <?php endif; ?>

    <div id="alertBox" class="alert d-none"></div>

    <div class="card">
        <div class="card-header bg-white py-3 d-flex align-items-sm-center flex-sm-row flex-column">
            <div class="flex-grow-1">
                <h5 class="mb-0">Daftar Sesi</h5>
            </div>
            <div class="text-end">
                <a href="<?= base_url('exam-sessions/create') ?>" class="btn btn-primary">
                    <i class="mdi mdi-plus me-1"></i> New Session
                </a>
            </div>
        </div>
        <div class="card-body">
            <table id="examSessionsTable" class="table table-hover align-middle" style="width:100%">
                <thead>
                    <tr>
                        <th style="width:120px">Code</th>
                        <th>Title</th>
                        <th>Department</th>
                        <th>Starts At</th>
                        <th class="text-center" style="width:120px">Status</th>
                        <th class="text-end" style="width:140px">Aksi</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>

</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<meta name="csrf-token" content="<?= csrf_hash() ?>">
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= base_url('assets/js/pages/exam-sessions-list.js') ?>"></script>
<?= $this->endSection() ?>