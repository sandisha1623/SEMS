<?php
/**
 * Shared form partial untuk create.php dan edit.php
 */
?>
<?= csrf_field() ?>

<div id="alertBox" class="alert d-none"></div>

<div class="row">
    <div class="col-md-4 mb-3">
        <label class="form-label">Code <span class="text-danger">*</span></label>
        <input type="text" name="code" class="form-control text-uppercase"
               value="<?= esc($department['code']) ?>"
               placeholder="TI" maxlength="20" required>
        <small class="text-muted">Kode singkat, otomatis uppercase.</small>
    </div>

    <div class="col-md-8 mb-3">
        <label class="form-label">Name <span class="text-danger">*</span></label>
        <input type="text" name="name" class="form-control"
               value="<?= esc($department['name']) ?>"
               placeholder="Teknik Informatika" required>
    </div>
</div>

<div class="row">
    <div class="col-md-6 mb-3">
        <label class="form-label">Fakultas</label>
        <input type="text" name="faculty" class="form-control"
               value="<?= esc($department['faculty']) ?>"
               placeholder="Fakultas Teknik">
    </div>

    <div class="col-md-6 mb-3">
        <label class="form-label">Nama Kaprodi</label>
        <input type="text" name="head_name" class="form-control"
               value="<?= esc($department['head_name']) ?>"
               placeholder="Dr. Ir. Budi Santoso, M.Kom.">
    </div>
</div>

<div class="mb-3">
    <label class="form-label">Icon</label>
    <div class="input-group" style="max-width: 320px;">
        <span class="input-group-text">
            <i id="iconPreview" class="mdi mdi-<?= esc($department['icon'] ?: 'domain') ?> fs-4"></i>
        </span>
        <input type="text" name="icon" id="iconInput" class="form-control"
               value="<?= esc($department['icon']) ?>"
               placeholder="domain"
               list="iconSuggestions">
    </div>
    <datalist id="iconSuggestions">
        <option value="domain">
        <option value="code-tags">
        <option value="database">
        <option value="flash">
        <option value="briefcase">
        <option value="function-variant">
        <option value="atom">
        <option value="calculator">
        <option value="factory">
        <option value="school">
        <option value="account-group">
        <option value="book-open-variant">
    </datalist>
    <small class="text-muted">
        Nama icon Material Design (tanpa prefix <code>mdi-</code>).
        Lihat referensi di
        <a href="https://pictogrammers.com/library/mdi/" target="_blank" rel="noopener">pictogrammers.com</a>.
    </small>
</div>

<div class="mb-3">
    <label class="form-label">Description</label>
    <textarea name="description" class="form-control" rows="3"
              placeholder="Optional"><?= esc($department['description']) ?></textarea>
</div>

<div class="mb-4">
    <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox"
               id="is_active" name="is_active" value="1"
               <?= ! empty($department['is_active']) ? 'checked' : '' ?>>
        <label class="form-check-label" for="is_active">Aktif</label>
    </div>
    <small class="text-muted">Department non-aktif tidak muncul di dropdown form sesi ujian.</small>
</div>

<div class="d-flex justify-content-end gap-2 mt-4">
    <a href="<?= base_url('departments') ?>" class="btn btn-light">Cancel</a>
    <button type="submit" class="btn btn-primary" id="submitBtn">
        <span id="submitSpinner" class="spinner-border spinner-border-sm d-none" aria-hidden="true"></span>
        <span class="btn-text">Save</span>
    </button>
</div>