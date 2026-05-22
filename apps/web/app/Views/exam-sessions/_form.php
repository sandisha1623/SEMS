<?php
/**
 * Shared form partial — dipakai create.php dan edit.php.
 *
 * Catatan: ends_at TIDAK ADA sebagai field input.
 * Server selalu menghitung ends_at = starts_at + duration_minutes.
 * Ini mencegah inkonsistensi data (mis. user ubah duration tapi
 * lupa update ends_at).
 */
$settings = $session['settings'] ?? [];
$sensitivity = $settings['alert_sensitivity'] ?? 'medium';
?>
<?= csrf_field() ?>

<div id="alertBox" class="alert d-none"></div>

<div class="row g-4">

    <!-- ====================================================== -->
    <!-- LEFT COLUMN — Core Configuration + Advanced            -->
    <!-- ====================================================== -->
    <div class="col-lg-8">

        <!-- Core Configuration card -->
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="mb-3">
                    <i class="mdi mdi-clipboard-text-outline text-primary me-2"></i>
                    Core Configuration
                </h5>

                <div class="mb-3">
                    <label class="form-label small text-uppercase fw-semibold text-muted">
                        Exam Name <span class="text-danger">*</span>
                    </label>
                    <input type="text" name="title" id="examTitle" class="form-control"
                           value="<?= esc($session['title']) ?>"
                           placeholder="e.g. Advanced Neural Architectures - Final"
                           required>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label small text-uppercase fw-semibold text-muted">
                            Department
                        </label>
                        <select name="department_id" id="examDepartment" class="form-select">
                            <option value="">— Pilih department —</option>
                            <?php foreach ($departments as $id => $name): ?>
                                <option value="<?= $id ?>"
                                    <?= (int)$session['department_id'] === (int)$id ? 'selected' : '' ?>>
                                    <?= esc($name) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label small text-uppercase fw-semibold text-muted">
                            Exam Date &amp; Time <span class="text-danger">*</span>
                        </label>
                        <input type="datetime-local" name="starts_at" id="examStartsAt" class="form-control"
                               value="<?= esc(str_replace(' ', 'T', substr($session['starts_at'], 0, 16))) ?>"
                               required>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label small text-uppercase fw-semibold text-muted">
                            Duration (Minutes) <span class="text-danger">*</span>
                        </label>
                        <input type="number" name="duration_minutes" id="examDuration" class="form-control"
                               value="<?= esc($session['duration_minutes']) ?>"
                               min="1" max="600" required>
                        <small class="text-muted">
                            Selesai pada <span id="endsAtPreview" class="fw-semibold">—</span>
                        </small>
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label small text-uppercase fw-semibold text-muted">
                            Timezone
                        </label>
                        <select name="timezone" class="form-select">
                            <?php foreach ($timezones as $tz => $label): ?>
                                <option value="<?= $tz ?>"
                                    <?= $session['timezone'] === $tz ? 'selected' : '' ?>>
                                    <?= esc($label) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="mb-2">
                    <label class="form-label small text-uppercase fw-semibold text-muted">
                        Code <span class="text-danger">*</span>
                        <a href="javascript:void(0)" id="toggleCodeEdit"
                           class="ms-2 text-decoration-none small text-primary">
                            <i class="mdi mdi-pencil"></i> Edit
                        </a>
                    </label>
                    <input type="text" name="code" id="examCode" class="form-control"
                           value="<?= esc($session['code']) ?>"
                           placeholder="Auto-generated dari title"
                           readonly required>
                    <small class="text-muted">
                        Otomatis dibuat dari title + tanggal. Klik "Edit" untuk override manual.
                    </small>
                </div>

            </div>
        </div>

        <!-- Advanced (collapsed) card -->
        <div class="card mb-3">
            <div class="card-header bg-white py-3" style="cursor: pointer;"
                 data-bs-toggle="collapse" data-bs-target="#advancedSection"
                 aria-expanded="false">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="mdi mdi-tune text-muted me-2"></i>
                        Advanced Options
                    </h5>
                    <i class="mdi mdi-chevron-down"></i>
                </div>
            </div>
            <div id="advancedSection" class="collapse">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label small text-uppercase fw-semibold text-muted">
                                Mode
                            </label>
                            <select name="mode" class="form-select">
                                <?php foreach (['online' => 'Online', 'offline' => 'Offline', 'hybrid' => 'Hybrid'] as $val => $label): ?>
                                    <option value="<?= $val ?>"
                                        <?= $session['mode'] === $val ? 'selected' : '' ?>>
                                        <?= $label ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label class="form-label small text-uppercase fw-semibold text-muted">
                                Status
                            </label>
                            <select name="status" class="form-select">
                                <?php foreach (['draft' => 'Draft', 'scheduled' => 'Scheduled', 'ongoing' => 'Ongoing', 'completed' => 'Completed', 'cancelled' => 'Cancelled'] as $val => $label): ?>
                                    <option value="<?= $val ?>"
                                        <?= $session['status'] === $val ? 'selected' : '' ?>>
                                        <?= $label ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="mb-0">
                        <label class="form-label small text-uppercase fw-semibold text-muted">
                            Description
                        </label>
                        <textarea name="description" class="form-control" rows="3"
                                  placeholder="Optional"><?= esc($session['description']) ?></textarea>
                    </div>
                </div>
            </div>
        </div>

        <!-- Participant Management placeholder -->
        <div class="card">
            <div class="card-body">
                <h5 class="mb-3">
                    <i class="mdi mdi-account-multiple-outline text-primary me-2"></i>
                    Participant Management
                </h5>

                <div class="border border-2 border-dashed rounded p-5 text-center text-muted"
                     style="border-color: #d1d5db !important;">
                    <i class="mdi mdi-upload fs-1 d-block mb-2"></i>
                    <p class="mb-1 fw-medium">Upload Student Roster</p>
                    <p class="small mb-3">Drag and drop CSV or XLSX files here</p>
                    <button type="button" class="btn btn-light btn-sm" disabled>
                        <i class="mdi mdi-folder-open-outline me-1"></i> Select File
                    </button>
                </div>

                <div class="alert alert-info mt-3 mb-0 d-flex align-items-start">
                    <i class="mdi mdi-information-outline me-2 fs-5"></i>
                    <div class="small flex-grow-1">
                        <strong>Available di Step 4.</strong>
                        Untuk sekarang, peserta dapat di-enroll setelah sesi disimpan.
                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- ====================================================== -->
    <!-- RIGHT COLUMN — Security Integrity                       -->
    <!-- ====================================================== -->
    <div class="col-lg-4">

        <div class="card mb-3">
            <div class="card-body">
                <h5 class="mb-3">Security Integrity</h5>

                <div class="mb-4">
                    <label class="form-label small text-uppercase fw-semibold text-muted">
                        Alert Sensitivity
                    </label>
                    <div class="btn-group w-100" role="group" id="sensitivityGroup">
                        <?php foreach (['low' => 'Low', 'medium' => 'Medium', 'high' => 'High'] as $val => $label): ?>
                            <input type="radio" class="btn-check"
                                   name="alert_sensitivity" id="sens_<?= $val ?>"
                                   value="<?= $val ?>"
                                   <?= $sensitivity === $val ? 'checked' : '' ?>>
                            <label class="btn btn-outline-primary" for="sens_<?= $val ?>">
                                <?= $label ?>
                            </label>
                        <?php endforeach; ?>
                    </div>
                </div>

                <?php
                $toggles = [
                    'face_recognition' => [
                        'label'   => 'Face Recognition',
                        'caption' => 'Identity verification',
                        'icon'    => 'face-recognition',
                    ],
                    'gaze_tracking' => [
                        'label'   => 'Gaze Tracking',
                        'caption' => 'Monitor off-screen focus',
                        'icon'    => 'eye-outline',
                    ],
                    'browser_lockdown' => [
                        'label'   => 'Browser Lockdown',
                        'caption' => 'Force full-screen mode',
                        'icon'    => 'monitor-lock',
                    ],
                    'object_detection' => [
                        'label'   => 'Object Detection',
                        'caption' => 'Phones, books, etc.',
                        'icon'    => 'cellphone-screenshot',
                    ],
                ];
                ?>

                <?php foreach ($toggles as $key => $cfg): ?>
                    <div class="d-flex align-items-center mb-3">
                        <div class="me-3" style="width:32px; text-align:center;">
                            <i class="mdi mdi-<?= esc($cfg['icon']) ?> fs-4 text-primary"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="fw-semibold"><?= esc($cfg['label']) ?></div>
                            <div class="small text-muted"><?= esc($cfg['caption']) ?></div>
                        </div>
                        <div class="form-check form-switch m-0">
                            <input class="form-check-input" type="checkbox"
                                   id="setting_<?= $key ?>"
                                   name="<?= $key ?>" value="1"
                                   <?= ! empty($settings[$key]) ? 'checked' : '' ?>>
                        </div>
                    </div>
                <?php endforeach; ?>

            </div>
        </div>

        <div class="card text-white" style="background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);">
            <div class="card-body">
                <h6 class="text-white mb-2">Secure Environment Preview</h6>
                <p class="small text-white-50 mb-3">
                    Visualisasi grid proctoring untuk konfigurasi ini.
                </p>

                <div class="bg-white bg-opacity-10 rounded p-3 mb-3 text-center"
                     style="min-height: 80px; display: flex; align-items: center; justify-content: center;">
                    <i class="mdi mdi-monitor-eye fs-1 text-white-50"></i>
                </div>

                <div class="small">
                    <div class="mb-1">
                        <span class="badge bg-success rounded-circle p-1 me-1"></span>
                        AI ENGINE: <strong>READY</strong>
                    </div>
                    <div>
                        <span class="badge bg-success rounded-circle p-1 me-1"></span>
                        EST. BANDWIDTH: <strong>1.2 GB/H</strong>
                    </div>
                </div>
            </div>
        </div>

    </div>

</div>

<div class="d-flex justify-content-end gap-2 mt-4">
    <a href="<?= base_url('exam-sessions') ?>" class="btn btn-light px-4">Discard Draft</a>
    <button type="submit" class="btn btn-primary px-4" id="submitBtn">
        <span id="submitSpinner" class="spinner-border spinner-border-sm d-none" aria-hidden="true"></span>
        <span class="btn-text">
            <?= empty($session['public_id']) ? 'Initialize Session' : 'Update Session' ?>
        </span>
    </button>
</div>