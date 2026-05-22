<?= $this->extend('layout/main') ?>

<?= $this->section('title') ?><?= esc($pageTitle) ?><?= $this->endSection() ?>

<?= $this->section('content') ?>

<div class="container-fluid">
    <div class="py-3 d-flex align-items-sm-center flex-sm-row flex-column">
        <div class="flex-grow-1">
            <a href="<?= base_url('departments') ?>" class="text-muted">
                <i class="mdi mdi-arrow-left"></i> Back to list
            </a>
            <h4 class="fs-18 fw-semibold m-0 text-black">Atur Sesi Ujian Baru</h4>
            <span class="fs-14 text-dark">Siapkan pengaturan pengawasan ketat untuk ujian mendatang.</span>
        </div>

        <div class="text-end">
            <ol class="breadcrumb m-0 py-0">
                <li class="breadcrumb-item"><a href="javascript: void(0);">Tables</a></li>
                <li class="breadcrumb-item active">Data Tables</li>
            </ol>
        </div>
    </div>

    <div class="card">
        <div class="card-body">
            <form id="departmentForm"
                  method="POST"
                  action="<?= base_url('departments/store') ?>"
                  novalidate>
                <?= $this->include('departments/_form') ?>
            </form>
        </div>
    </div>

</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<meta name="csrf-token" content="<?= csrf_hash() ?>">
<script src="<?= base_url('assets/js/pages/departments-form.js') ?>"></script>
<?= $this->endSection() ?>