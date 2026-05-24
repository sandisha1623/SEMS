<?php
/**
 * Shared form partial untuk create.php dan edit.php.
 * Variable:
 *   $user        : array data user
 *   $roles       : array id => name
 *   $departments : array id => name
 */
$isEdit = ! empty($user['public_id']);
?>
<?= csrf_field() ?>

<div id="alertBox" class="alert d-none"></div>

<div class="row">

    <!-- LEFT — Identitas -->
    <div class="col-lg-7">
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="mb-3">
                    <i class="mdi mdi-account-outline text-primary me-2"></i>
                    Identitas
                </h5>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label small text-uppercase fw-semibold text-muted">
                            Username <span class="text-danger">*</span>
                        </label>
                        <input type="text" name="username" class="form-control"
                               value="<?= esc($user['username']) ?>"
                               placeholder="superadmin"
                               <?= $isEdit ? 'readonly' : '' ?>
                               required>
                        <?php if ($isEdit): ?>
                            <small class="text-muted">Username tidak dapat diubah.</small>
                        <?php endif; ?>
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label small text-uppercase fw-semibold text-muted">
                            Email <span class="text-danger">*</span>
                        </label>
                        <input type="email" name="email" class="form-control"
                               value="<?= esc($user['email']) ?>"
                               placeholder="user@example.com" required>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label small text-uppercase fw-semibold text-muted">
                        Nama Lengkap
                    </label>
                    <input type="text" name="full_name" class="form-control"
                           value="<?= esc($user['full_name']) ?>"
                           placeholder="Optional">
                </div>

                <div class="mb-0">
                    <label class="form-label small text-uppercase fw-semibold text-muted">
                        Password
                        <?php if (! $isEdit): ?>
                            <span class="text-danger">*</span>
                        <?php endif; ?>
                    </label>
                    <input type="password" name="password" class="form-control"
                           placeholder="<?= $isEdit ? 'Kosongkan jika tidak ingin mengubah' : 'Minimal 8 karakter' ?>"
                           <?= $isEdit ? '' : 'required' ?>
                           autocomplete="new-password">
                    <small class="text-muted">
                        Minimal 8 karakter.
                        <?php if ($isEdit): ?>
                            Kosongkan untuk mempertahankan password lama.
                        <?php endif; ?>
                    </small>
                </div>
            </div>
        </div>
    </div>

    <!-- RIGHT — Role & Department -->
    <div class="col-lg-5">
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="mb-3">
                    <i class="mdi mdi-shield-account-outline text-primary me-2"></i>
                    Role &amp; Akses
                </h5>

                <div class="mb-3">
                    <label class="form-label small text-uppercase fw-semibold text-muted">
                        Role <span class="text-danger">*</span>
                    </label>
                    <select name="role_id" id="roleSelect" class="form-select" required>
                        <option value="">— Pilih role —</option>
                        <?php foreach ($roles as $id => $name): ?>
                            <option value="<?= $id ?>"
                                <?= (int)$user['role_id'] === (int)$id ? 'selected' : '' ?>
                                data-slug="<?= esc(strtolower(str_replace(' ', '-', $name))) ?>">
                                <?= esc($name) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="mb-3">
                    <label class="form-label small text-uppercase fw-semibold text-muted">
                        Department
                        <span id="departmentRequired" class="text-danger d-none">*</span>
                    </label>
                    <select name="department_id" id="departmentSelect" class="form-select">
                        <option value="">— Tidak ada —</option>
                        <?php foreach ($departments as $id => $name): ?>
                            <option value="<?= $id ?>"
                                <?= (int)$user['department_id'] === (int)$id ? 'selected' : '' ?>>
                                <?= esc($name) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                    <small class="text-muted">
                        Wajib diisi untuk role <strong>Student</strong>.
                    </small>
                </div>

                <div class="mb-0">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox"
                               id="is_active" name="is_active" value="1"
                               <?= ! empty($user['is_active']) ? 'checked' : '' ?>>
                        <label class="form-check-label" for="is_active">
                            Akun Aktif
                        </label>
                    </div>
                    <small class="text-muted">Non-aktif: user tidak bisa login.</small>
                </div>
            </div>
        </div>
    </div>

</div>

<div class="d-flex justify-content-end gap-2 mt-3">
    <a href="<?= base_url('users') ?>" class="btn btn-light px-4">Cancel</a>
    <button type="submit" class="btn btn-primary px-4" id="submitBtn">
        <span id="submitSpinner" class="spinner-border spinner-border-sm d-none" aria-hidden="true"></span>
        <span class="btn-text"><?= $isEdit ? 'Update User' : 'Create User' ?></span>
    </button>
</div>