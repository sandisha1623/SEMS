<?= $this->extend('layout/main') ?>

<?= $this->section('title') ?><?= esc($pageTitle) ?><?= $this->endSection() ?>

<?= $this->section('content') ?>

<div class="container-fluid">
    <div class="py-3 d-flex align-items-sm-center flex-sm-row flex-column">
        <div class="flex-grow-1">
            <h3 class="fs-22 fw-semibold m-0 text-black"><?= esc($pageTitle) ?></h3>
            <span class="fs-14 text-dark">Set up high-integrity monitoring parameters for the upcoming evaluation.</span>
        </div>

        <div class="text-end">
            <ol class="breadcrumb m-0 py-0">
                <li class="breadcrumb-item"><a href="javascript: void(0);">Tables</a></li>
                <li class="breadcrumb-item active">Data Tables</li>
            </ol>
        </div>
    </div>

    <form id="examSessionForm"
          method="POST"
          action="<?= base_url('exam-sessions/store') ?>"
          novalidate>
        <?= $this->include('exam-sessions/_form') ?>
    </form>

</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<meta name="csrf-token" content="<?= csrf_hash() ?>">
<script src="<?= base_url('assets/js/pages/exam-sessions-form.js') ?>"></script>
<?= $this->endSection() ?>