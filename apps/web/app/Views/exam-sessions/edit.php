<?= $this->extend('layout/main') ?>

<?= $this->section('title') ?><?= esc($pageTitle) ?><?= $this->endSection() ?>

<?= $this->section('content') ?>

<div class="container-fluid">

    <div class="d-flex justify-content-between align-items-start mb-4">
        <div>
            <div class="small text-muted mb-1">
                <a href="<?= base_url('exam-sessions') ?>" class="text-muted text-decoration-none">
                    Exam Sessions
                </a>
                <span class="mx-1">›</span>
                <span class="text-primary">Edit</span>
            </div>
            <h3 class="mb-0"><?= esc($pageTitle) ?></h3>
            <small class="text-muted"><?= esc($session['public_id']) ?></small>
        </div>
    </div>

    <form id="examSessionForm"
          method="POST"
          action="<?= base_url('exam-sessions/' . $session['public_id'] . '/update') ?>"
          novalidate>
        <?= $this->include('exam-sessions/_form') ?>
    </form>

</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<meta name="csrf-token" content="<?= csrf_hash() ?>">
<script src="<?= base_url('assets/js/pages/exam-sessions-form.js') ?>"></script>
<?= $this->endSection() ?>