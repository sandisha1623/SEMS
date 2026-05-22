<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Filter auth untuk halaman web (bukan API).
 *
 * Perbedaan dengan AuthFilter/JwtAuthFilter:
 *   - Tidak return JSON error
 *   - Tidak baca token dari Authorization header
 *   - Cek session-based (logged_in flag dari AuthService::login())
 *   - Redirect ke /login dengan flash message
 *
 * Pakai untuk semua route halaman web (dashboard, exam-sessions, dst):
 *
 *   $routes->group('exam-sessions', ['filter' => 'web-auth'], ...);
 */
class WebAuthFilter implements FilterInterface
{
    public function before(
        RequestInterface $request,
        $arguments = null
    ) {
        if (! session('logged_in')) {
            // Simpan URL yang dituju supaya bisa di-redirect balik
            // setelah login (intended URL pattern).
            $intendedUrl = $request->getUri()->getPath();

            session()->setFlashdata(
                'error',
                'Silakan login terlebih dahulu.'
            );

            session()->set('intended_url', $intendedUrl);

            return redirect()->to('/login');
        }
    }

    public function after(
        RequestInterface $request,
        ResponseInterface $response,
        $arguments = null
    ) {
    }
}