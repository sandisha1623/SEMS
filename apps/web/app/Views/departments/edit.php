<?= $this->extend('layout/main') ?>

<?= $this->section('title') ?><?= esc($pageTitle) ?><?= $this->endSection() ?>

<?= $this->section('content') ?>

<div class="container-fluid">

    <div class="mb-3">
        <a href="<?= base_url('departments') ?>" class="text-muted">
            <i class="mdi mdi-arrow-left"></i> Back to list
        </a>
        <h4 class="mb-0 mt-2"><?= esc($pageTitle) ?></h4>
        <small class="text-muted"><?= esc($department['public_id']) ?></small>
    </div>

    <div class="card">
        <div class="card-body">
            <form id="departmentForm"
                  method="POST"
                  action="<?= base_url('departments/' . $department['public_id'] . '/update') ?>"
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