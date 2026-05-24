<div class="app-sidebar-menu">
    <div class="h-100" data-simplebar>
        <div id="sidebar-menu">
            <div class="logo-box">
                <a class='logo logo-light' href='<?= base_url('dashboard') ?>'>
                    <span class="logo-sm">
                        <img src="<?= base_url('assets/images/logo.svg') ?>" alt="" height="22">
                    </span>
                    <span class="logo-lg">
                        <img src="<?= base_url('assets/images/logo.svg') ?>" alt="" height="24">
                    </span>
                </a>
                <a class='logo logo-dark' href='<?= base_url('dashboard') ?>'>
                    <span class="logo-sm">
                        <img src="<?= base_url('assets/images/logo.svg') ?>" alt="" height="22">
                    </span>
                    <span class="logo-lg">
                        <img src="<?= base_url('assets/images/logo.svg') ?>" alt="logo" width="200" height="56">
                    </span>
                </a>
            </div>

            <?php
                $currentPath = service('request')->getUri()->getPath();
                $isActive    = fn ($prefix) => str_starts_with($currentPath, $prefix) ? 'active' : '';
                $auth        = service('auth');
            ?>

            <ul id="side-menu">
                <li class="menu-title">Main</li>

                <li>
                    <a href="<?= base_url('dashboard') ?>" class="<?= $isActive('/dashboard') ?>">
                        <i data-feather="home"></i>
                        <span>Dashboard</span>
                    </a>
                </li>

                <?php if ($auth->hasPermission('exam.manage')): ?>
                <li class="menu-title">Exam Management</li>

                <li>
                    <a href="<?= base_url('exam-sessions') ?>" class="<?= $isActive('/exam-sessions') ?>">
                        <span class="mdi mdi-clipboard-text-clock fs-16 me-1 ms-1"></span>
                        <span>Exam Sessions</span>
                    </a>
                </li>
                <?php endif; ?>

                <?php
                $hasUsersManage    = $auth->hasPermission('users.manage');
                $hasSettingsManage = $auth->hasPermission('settings.manage');
                ?>

                <?php if ($hasUsersManage || $hasSettingsManage): ?>
                <li class="menu-title">Master Data</li>

                <?php if ($hasUsersManage): ?>
                <li>
                    <a href="<?= base_url('users') ?>" class="<?= $isActive('/users') ?>">
                        <span class="mdi mdi-account-multiple fs-16 me-1 ms-1"></span>
                        <span>Users</span>
                    </a>
                </li>
                <?php endif; ?>

                <?php if ($hasSettingsManage): ?>
                <li>
                    <a href="<?= base_url('departments') ?>" class="<?= $isActive('/departments') ?>">
                        <span class="mdi mdi-domain fs-16 me-1 ms-1"></span>
                        <span>Departments</span>
                    </a>
                </li>
                <?php endif; ?>

                <?php endif; ?>

            </ul>
        </div>
        <div class="clearfix"></div>
    </div>
</div>