<?= $this->extend('layout/main') ?>
<?= $this->section('title') ?>Dashboard<?= $this->endSection() ?>

<?= $this->section('content') ?>

    <div class="card">

        <div class="card-body">

            <h5>
                🔔 Notifications
            </h5>

            <div class="mb-3">

                Unread:
                <span
                    id="notif-count"
                    class="badge bg-danger"
                >
                    0
                </span>

            </div>

            <div id="notif-list"></div>

        </div>

    </div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script src="<?= base_url('assets/js/pages/dashboard.js'); ?>"></script>
<?= $this->endSection() ?>