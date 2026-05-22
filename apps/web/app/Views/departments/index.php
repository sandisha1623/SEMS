<?= $this->extend('layout/main') ?>

<?= $this->section('title') ?><?= esc($pageTitle) ?><?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css">
<?= $this->endSection() ?>

<?= $this->section('content') ?>

<div class="container-fluid">

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

    <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0"><?= esc($pageTitle) ?></h4>
        <a href="<?= base_url('departments/create') ?>" class="btn btn-primary">
            <i class="mdi mdi-plus me-1"></i> New Department
        </a>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-md-4">
            <div class="stats-card">
                <div class="stats-label">Total Departemen</div>
                <div class="d-flex align-items-baseline">
                    <div class="stats-value"><?= esc($summary['total_departments']) ?></div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="stats-card">
                <div class="stats-label">Mahasiswa Terdaftar</div>
                <div class="d-flex align-items-baseline">
                    <div class="stats-value"><?= $summary['students_total'] !== null ? esc($summary['students_total']) : '—' ?></div>
                    <?php if ($summary['students_total'] === null): ?>
                        <span class="stats-meta">data peserta belum tersedia</span>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="stats-card">
                <div class="stats-label">Ujian Aktif</div>
                <div class="d-flex align-items-baseline">
                    <div class="stats-value"><?= esc($summary['active_exams']) ?></div>
                </div>
            </div>
        </div>
    </div>

    <?php if (session()->getFlashdata('success')): ?>
        <div class="alert alert-success">
            <?= session()->getFlashdata('success') ?>
        </div>
    <?php endif; ?>

    <div id="alertBox" class="alert d-none"></div>

    <div class="card">
        <div class="card-body">
            <table id="departmentsTable" class="table table-hover" style="width:100%">
                <thead>
                    <tr>
                        <th>Departemen</th>
                        <th>Nama Kaprodi</th>
                        <th class="text-center">Mahasiswa</th>
                        <th class="text-center">Ujian Aktif</th>
                        <th class="text-center">Status</th>
                        <th class="text-end">Aksi</th>
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
<script src="<?= base_url('assets/js/pages/departments-list.js') ?>"></script>
<?= $this->endSection() ?>