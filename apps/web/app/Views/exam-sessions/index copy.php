<?= $this->extend('layout/main') ?>
<?= $this->section('title') ?>Exam Sessions<?= $this->endSection() ?>
<?= $this->section('styles') ?>
<link rel="stylesheet" href="<?= base_url('assets/libs/dropzone/dropzone.css') ?>">
<?= $this->endSection() ?>

<?= $this->section('content') ?>

    <div class="container-fluid">
        <div class="py-3 d-flex align-items-sm-center flex-sm-row flex-column">
            <div class="flex-grow-1">
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
        <div class="row">
            <div class="col-8">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title mb-3 text-black"><i class="mdi mdi-clipboard-text-outline"></i> Konfigurasi Utama</h5>
                        <form class="row g-3 needs-validation">
                            <div class="row g-3">
                                <div class="col-md-12 position-relative">
                                    <label for="examname" class="form-label text-dark">NAMA UJIAN</label>
                                    <input type="text" name="examname" class="form-control form-control-lg" id="examname" placeholder="e.g. Advanced Neural Architectures - Final">
                                    <div class="valid-tooltip">Looks good!</div>
                                </div>
                            </div>
                            <div class="row g-3">
                                <div class="col-md-6 position-relative">
                                    <label for="examname" class="form-label text-dark">DEPARTEMEN</label>
                                    <input type="text" name="examname" class="form-control form-control-lg" id="examname" placeholder="e.g. Advanced Neural Architectures - Final">
                                    <div class="valid-tooltip">Looks good!</div>
                                </div>
                                <div class="col-md-6 position-relative">
                                    <label for="examname" class="form-label text-dark">TANGGAL & WAKTU UJIAN</label>
                                    <input type="text" name="examname" class="form-control form-control-lg" id="examname" placeholder="e.g. Advanced Neural Architectures - Final">
                                    <div class="valid-tooltip">Looks good!</div>
                                </div>
                            </div>
                            <div class="row g-3">
                                <div class="col-md-6 position-relative">
                                    <label for="examduration" class="form-label text-dark">DURASI (MENIT)</label>
                                    <input type="text" name="examduration" class="form-control form-control-lg" id="examduration" placeholder="e.g. Advanced Neural Architectures - Final">
                                    <div class="valid-tooltip">Looks good!</div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title mb-4 text-black"><i class="mdi mdi-account-group-outline"></i> Manajemen Peserta</h5>
                        <form class="dropzone needsclick" id="dropzone-basic">
                            <div class="row g-3">
                                <div class="col-md-12 position-relative">
                                    <div class="dz-message needsclick">
                                        Upload Student
                                        <span class="note needsclick">Drag and drop CSV or XLSX files here</span>
                                    </div>
                                    <div class="fallback">
                                        <input name="file" type="file" />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script src="<?= base_url('assets/libs/dropzone/dropzone.js'); ?>"></script>
<script src="<?= base_url('assets/js/forms-file-upload.js'); ?>"></script>
<script src="<?= base_url('assets/js/pages/dashboard.js'); ?>"></script>
<?= $this->endSection() ?>