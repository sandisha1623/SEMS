<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title><?= $this->renderSection('title') ?> - SEMS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="A fully featured admin theme which can be used to build CRM, CMS, etc."/>
        <meta name="author" content="Zoyothemes"/>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <link rel="shortcut icon" href="<?= base_url('assets/images/favicon.ico') ?>">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap" />
        
        <!-- Styles -->
        <link rel="stylesheet" href="<?= base_url('assets/css/app.min.css') ?>">
        <link rel="stylesheet" href="<?= base_url('assets/css/icons.min.css') ?>">

        <?= $this->renderSection('styles') ?> 

    </head>
    
    <body data-menu-color="light" data-sidebar="default">
        <div id="app-layout">
            <?= $this->include('layout/navbar') ?>
            <?= $this->include('layout/sidebar') ?>
            <div class="content-page">
                <div class="content">
                    <?= $this->renderSection('content') ?>
                </div>
                <?= $this->include('layout/footer') ?>
            </div>
        </div>

        <script src="<?= base_url('assets/libs/jquery/jquery.min.js') ?>"></script>
        <script src="<?= base_url('assets/libs/bootstrap/js/bootstrap.bundle.min.js') ?>"></script>
        <script src="<?= base_url('assets/libs/simplebar/simplebar.min.js') ?>"></script>
        <script src="<?= base_url('assets/libs/node-waves/waves.min.js') ?>"></script>
        <script src="<?= base_url('assets/libs/waypoints/lib/jquery.waypoints.min.js'); ?>"></script>
        <script src="<?= base_url('assets/libs/jquery.counterup/jquery.counterup.min.js'); ?>"></script>
        <script src="<?= base_url('assets/libs/feather-icons/feather.min.js'); ?>"></script>
        <script src="<?= base_url('assets/js/app.js') ?>"></script>
    </body>
</html>