<?= $this->extend('layout/main') ?>

<?= $this->section('title') ?><?= esc($pageTitle) ?><?= $this->endSection() ?>

<?= $this->section('content') ?>

<div class="container-fluid">

    <div class="mb-3">
        <div class="small text-muted mb-1">
            <a href="<?= base_url('users') ?>" class="text-muted text-decoration-none">Users</a>
            <span class="mx-1">›</span>
            <span class="text-primary">Edit</span>
        </div>
        <h3 class="mb-0"><?= esc($pageTitle) ?></h3>
        <small class="text-muted"><?= esc($user['public_id']) ?></small>
    </div>

    <form id="userForm"
          method="POST"
          action="<?= base_url('users/' . $user['public_id'] . '/update') ?>"
          novalidate
          autocomplete="off">
        <?= $this->include('users/_form') ?>
    </form>

</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<meta name="csrf-token" content="<?= csrf_hash() ?>">
<script src="<?= base_url('assets/js/pages/users-form.js') ?>"></script>
<?= $this->endSection() ?>