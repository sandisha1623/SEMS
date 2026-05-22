<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Login - SEMS</title>
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
        <link rel="stylesheet" href="<?= base_url('assets/css/login.css') ?>">

        <?= $this->renderSection('styles') ?> 

    </head>
    
    <body class="bg-primary-subtle">
        <div class="account-page">
            <div class="container">
                <div class="row align-items-center justify-content-center g-0">
                    <div class="col-xl-9 mx-auto">
                        <div class="card mb-0">
                            <div class="card-body p-0">
                                <div class="row">
                                    <div class="col-md-6 p-5">
                                        <div class="mb-0 border-0 p-md-5 p-lg-0 p-4">
                                            <div class="auth-title-section mb-3 text-left"> 
                                                <h3 class="text-dark fs-20 fw-medium mb-2">Selamat datang</h3>
                                                <p class="text-dark text-capitalize fs-14 mb-0">Sistem Pengawasan Ujian (SEMS). Silakan masuk dengan akun Anda.</p>
                                            </div>
                                            <div class="pt-0">
                                                <?php if(session()->getFlashdata('error')): ?>

                                                    <div class="alert alert-danger">
                                                        <?= session()->getFlashdata('error') ?>
                                                    </div>

                                                <?php endif; ?>

                                                <div id="alertBox" class="alert d-none" role="alert"></div>

                                                <form id="loginForm" class="my-4" novalidate autocomplete="off">
                                                    <?= csrf_field() ?>
                                                    <div class="form-group form-control-validation mb-3">
                                                        <label for="username" class="form-label">Username</label>
                                                        <input type="text" class="form-control" id="username" name="username" value="<?= esc($username ?? '') ?>" placeholder="Enter your username" autofocus />
                                                    </div>
                                                    <div class="form-group form-password-toggle form-control-validation mb-3">
                                                        <label class="form-label" for="password">Password</label>
                                                        <div class="input-group input-group-merge">
                                                            <input type="password" id="password" class="form-control border-end-0" name="password" aria-describedby="password" />
                                                            <span class="input-group-text cursor-pointer bg-transparent" id="togglePw">
                                                                <span class="mdi mdi-eye-outline"></span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div class="form-group d-flex mb-3">
                                                        <div class="col-sm-7">
                                                            <div class="form-check">
                                                                <input type="checkbox" class="form-check-input" id="checkbox-signin" checked>
                                                                <label class="form-check-label" for="checkbox-signin">Ingat saya di perangkat ini</label>
                                                            </div>
                                                        </div>
                                                        <div class="col-sm-5 text-end">
                                                            <a class='text-muted fs-14' href='/silva/html/auth-recoverpw'>Lupa password?</a>                             
                                                        </div>
                                                    </div>
                                                    <div class="form-group mb-0 row">
                                                        <div class="col-12">
                                                            <div class="d-grid">
                                                                <button id="loginBtn" class="btn btn-primary btn-login">
                                                                    <span id="loginSpinner" class="spinner-border spinner-border-sm btn-spinner" aria-hidden="true" hidden></span>
                                                                    <span class="btn-text">Masuk</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 bg-primary p-0">
                                        <div class="img-login p-5">
                                            <div class="p-0 d-flex flex-column">
                                                <a class='auth-logo mb-2' href='/silva/html/'>
                                                    <img src="assets/images/small-logo.png" alt="logo-dark" class="img-responsive" width="85" height="27" />
                                                </a>
                                                <span class="fs-16 text-white">The Intelligence behind Integrity.</span>
                                                <span class="fs-16 text-white mb-5 pb-5">Sistem Deteksi Kecurangan Ujian Berbasis AI</span>
                                                <div class="d-flex flex-column overlay mt-5 p-3 text-white border rounded-2">
                                                    <span class="mb-0"><i class="mdi mdi-shield-check-outline"></i> SECURE ENVIRONMENT</span>
                                                    <span class="mb-0">Sistem ini memonitor aktivitas secara real-time untuk memastikan standar integritas akademik tertinggi di setiap sesi ujian.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script src="<?= base_url('assets/js/login.js') ?>"></script>
    </body>
</html>