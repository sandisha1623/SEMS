<!doctype html>
<html lang="en">
    <head>
        <title>SEMS Login</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="<?= csrf_hash() ?>">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    
    <body class="bg-light">

        <div class="container">

            <div class="row justify-content-center min-vh-100 align-items-center">

                <div class="col-md-4">

                    <div class="card shadow-sm border-0">

                        <div class="card-body p-4">

                            <h3 class="mb-4 text-center">
                                SEMS Login
                            </h3>

                            <?php if(session()->getFlashdata('error')): ?>

                                <div class="alert alert-danger">
                                    <?= session()->getFlashdata('error') ?>
                                </div>

                            <?php endif; ?>

                            <div id="alertBox" class="alert d-none" role="alert"></div>

                            <form id="loginForm">

                                <?= csrf_field() ?>

                                <div class="mb-3">

                                    <label class="form-label">
                                        Username
                                    </label>

                                    <input
                                        type="text"
                                        name="username"
                                        class="form-control" 
                                        autofocus 
                                        required
                                    >

                                </div>

                                <div class="mb-3">

                                    <label class="form-label">
                                        Password
                                    </label>

                                    <input
                                        type="password"
                                        name="password"
                                        class="form-control"
                                        required
                                    >

                                </div>

                                <button
                                    type="submit"
                                    class="btn btn-dark w-100"
                                    id="loginBtn"
                                >
                                    <span
                                        id="loginSpinner"
                                        class="spinner-border spinner-border-sm d-none"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    <span class="btn-text">Login</span>
                                </button>

                            </form>

                        </div>

                    </div>

                </div>

            </div>

        </div>

        <script src="<?= base_url('assets/js/login.js') ?>"></script>
    </body>
</html>