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

    .user-cell {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #eef2ff;
        color: #4f46e5;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.85rem;
        flex-shrink: 0;
    }
    .user-name    { font-weight: 600; color: #1f2937; line-height: 1.2; }
    .user-email   { font-size: 0.75rem; color: #6c757d; }

    .dept-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .dept-icon-sm {
        width: 24px; height: 24px;
        border-radius: 5px;
        background: #eef2ff;
        color: #4f46e5;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        flex-shrink: 0;
    }

    .role-pill {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.2rem 0.6rem;
        border-radius: 10px;
        background: #f3f4f6;
        color: #374151;
    }

    .status-pill {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .status-pill.active   { background: #ecfdf5; color: #047857; }
    .status-pill.inactive { background: #f3f4f6; color: #6b7280; }
</style>
<?= $this->endSection() ?>

<?= $this->section('content') ?>

<div class="container-fluid">

    <div class="d-flex justify-content-between align-items-start mb-4">
        <div>
            <div class="small text-muted mb-1">
                Admin <span class="mx-1">›</span>
                <span class="text-primary">Users</span>
            </div>
            <h3 class="mb-0"><?= esc($pageTitle) ?></h3>
        </div>
        <a href="<?= base_url('users/create') ?>" class="btn btn-primary">
            <i class="mdi mdi-plus me-1"></i> Tambah Pengguna
        </a>
    </div>

    <!-- Stats panel -->
    <div class="row g-3 mb-4">
        <div class="col-md-4">
            <div class="stats-card">
                <div class="stats-label">Total Pengguna</div>
                <div class="stats-value"><?= esc($summary['total']) ?></div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="stats-card">
                <div class="stats-label">Aktif</div>
                <div class="stats-value text-success"><?= esc($summary['active']) ?></div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="stats-card">
                <div class="stats-label">Mahasiswa Terdaftar</div>
                <div class="stats-value text-primary"><?= esc($summary['students']) ?></div>
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
                <h5 class="mb-0">Daftar Pengguna</h5>
                <div class="d-flex gap-2">
                    <select id="roleFilter" class="form-select" style="min-width: 180px;">
                        <option value="">Semua Role</option>
                        <?php foreach ($rolesForFilter as $slug => $name): ?>
                            <option value="<?= esc($slug) ?>"><?= esc($name) ?></option>
                        <?php endforeach; ?>
                    </select>
                    <select id="statusFilter" class="form-select" style="min-width: 140px;">
                        <option value="">Semua Status</option>
                        <option value="1">Aktif</option>
                        <option value="0">Non-Aktif</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="card-body">
            <table id="usersTable" class="table table-hover align-middle" style="width:100%">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Full Name</th>
                        <th>Role</th>
                        <th>Department</th>
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
<!-- ID user yang sedang login (untuk proteksi delete self) -->
<meta name="current-user-id" content="<?= esc(session('user.public_id')) ?>">

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= base_url('assets/js/pages/users-list.js') ?>"></script>
<?= $this->endSection() ?>