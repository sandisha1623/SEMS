<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Filter permission untuk halaman web.
 *
 * Cara pakai (di Routes.php):
 *
 *   $routes->group(
 *       'exam-sessions',
 *       ['filter' => 'web-permission:exam.manage'],
 *       function ($routes) { ... }
 *   );
 *
 * Atau multi-permission (user butuh salah satu = OR):
 *
 *   ['filter' => 'web-permission:exam.manage,exam.review']
 *
 * Berbeda dengan PermissionFilter (API):
 *   - Tidak return JSON
 *   - Render halaman 403 atau redirect ke dashboard dengan flash error
 */
class WebPermissionFilter implements FilterInterface
{
    public function before(
        RequestInterface $request,
        $arguments = null
    ) {
        $auth = service('auth');

        // Belum login → redirect ke login
        if (! $auth->check()) {
            session()->setFlashdata(
                'error',
                'Silakan login terlebih dahulu.'
            );

            return redirect()->to('/login');
        }

        // Tidak ada permission yang di-require → lewat
        if (empty($arguments)) {
            return;
        }

        // Cek apakah user punya minimal salah satu permission (OR)
        foreach ($arguments as $permission) {
            if ($auth->hasPermission($permission)) {
                return; // pass
            }
        }

        // Tidak punya satu pun → 403
        return $this->renderForbidden($arguments);
    }

    public function after(
        RequestInterface $request,
        ResponseInterface $response,
        $arguments = null
    ) {
    }

    /**
     * Render halaman 403. Pakai flash + redirect ke dashboard
     * supaya user tidak stuck di halaman error.
     */
    protected function renderForbidden(array $required)
    {
        $message = 'Anda tidak memiliki akses ke halaman ini.';

        // Untuk AJAX request, response harus JSON
        if (service('request')->isAJAX()) {
            return service('response')
                ->setStatusCode(403)
                ->setJSON([
                    'success'             => false,
                    'message'             => $message,
                    'required_permissions' => $required,
                ]);
        }

        session()->setFlashdata('error', $message);

        return redirect()->to('/dashboard');
    }
}