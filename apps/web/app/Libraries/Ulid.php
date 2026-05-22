<?php

namespace App\Libraries;

use InvalidArgumentException;
use RuntimeException;

/**
 * ULID (Universally Unique Lexicographically Sortable Identifier).
 *
 * Format: 26 karakter Crockford Base32, 128-bit total.
 *   01HX5MK4N7Q...     (10 char timestamp ms + 16 char randomness)
 *
 * Properti penting:
 *   - Sortable by creation time (time-ordered prefix)
 *   - Globally unique (80 bits randomness)
 *   - Case-insensitive, URL-safe
 *   - Lebih kecil dari UUID (26 chars vs 36)
 *
 * Spec: https://github.com/ulid/spec
 *
 * Dengan prefix style Stripe untuk self-documenting ID di log:
 *   usr_01HX5MK4N7Q...
 *   exm_01HX5MK4N7Q...
 *   par_01HX5MK4N7Q...
 *
 * Total panjang dengan prefix: 30 chars (3 prefix + 1 underscore + 26 ULID).
 */
class Ulid
{
    /**
     * Crockford Base32 alphabet — exclude I, L, O, U untuk hindari konfusi.
     */
    private const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

    /**
     * Regex eksplisit untuk Crockford Base32 (case-insensitive).
     */
    private const ULID_REGEX = '/\A[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}\z/';

    /**
     * Mapping prefix → tabel. Sumber of truth untuk semua public_id.
     * Tambahkan entry baru saat bikin tabel baru.
     */
    public const PREFIX_MAP = [
        'usr' => 'users',
        'rol' => 'roles',
        'prm' => 'permissions',
        'dpt' => 'departments',
        'exm' => 'exam_sessions',
        'par' => 'exam_participants',
        'frf' => 'face_references',
        'vio' => 'violations',
        'evd' => 'evidence',
    ];

    /**
     * Generate ULID 26-char tanpa prefix.
     *
     *   01HX5MK4N7Q8YPQR1234567890
     */
    public static function generate(): string
    {
        $timestampMs = (int) (microtime(true) * 1000);

        return self::encodeTime($timestampMs, 10) . self::encodeRandom(16);
    }

    /**
     * Generate ULID dengan prefix Stripe-style.
     *
     *   Ulid::generateWithPrefix('usr')  →  "usr_01HX5MK4N7Q..."
     */
    public static function generateWithPrefix(string $prefix): string
    {
        self::validatePrefix($prefix);

        return $prefix . '_' . self::generate();
    }

    /**
     * Convenience: generate ULID berdasarkan nama tabel.
     * Lebih aman dari typo prefix.
     *
     *   Ulid::forTable('users')  →  "usr_01HX..."
     */
    public static function forTable(string $tableName): string
    {
        $prefix = array_search($tableName, self::PREFIX_MAP, true);

        if ($prefix === false) {
            throw new InvalidArgumentException(
                "No ULID prefix registered for table '{$tableName}'. "
                . 'Add it to Ulid::PREFIX_MAP.'
            );
        }

        return self::generateWithPrefix($prefix);
    }

    /**
     * Validasi format ULID (dengan/tanpa prefix).
     *
     *   isValid('01HX5MK4N7Q...')             → true
     *   isValid('usr_01HX5MK4N7Q...')         → true
     *   isValid('not-a-ulid')                 → false
     */
    public static function isValid(string $value): bool
    {
        $body = $value;

        if (str_contains($value, '_')) {
            [$prefix, $body] = explode('_', $value, 2);

            if (! array_key_exists($prefix, self::PREFIX_MAP)) {
                return false;
            }
        }

        return preg_match(self::ULID_REGEX, $body) === 1;
    }

    /**
     * Extract timestamp (UNIX seconds) dari ULID.
     * Berguna untuk debugging — bisa lihat kapan ID dibuat.
     */
    public static function timestampOf(string $value): ?int
    {
        if (! self::isValid($value)) {
            return null;
        }

        $body = str_contains($value, '_')
            ? explode('_', $value, 2)[1]
            : $value;

        $timeChars = strtoupper(substr($body, 0, 10));
        $ms        = 0;

        for ($i = 0; $i < 10; $i++) {
            $pos = strpos(self::ALPHABET, $timeChars[$i]);
            if ($pos === false) {
                return null;
            }
            $ms = $ms * 32 + $pos;
        }

        return (int) ($ms / 1000);
    }

    /**
     * Encode timestamp (ms) ke 10 char Crockford Base32.
     * Aman untuk PHP 64-bit (timestamp ms muat di int64).
     */
    private static function encodeTime(int $ms, int $length): string
    {
        if (PHP_INT_SIZE < 8) {
            throw new RuntimeException(
                'ULID requires 64-bit PHP. Current PHP_INT_SIZE: ' . PHP_INT_SIZE
            );
        }

        $out = '';
        for ($i = $length - 1; $i >= 0; $i--) {
            $mod = $ms % 32;
            $out = self::ALPHABET[$mod] . $out;
            $ms  = intdiv($ms, 32);
        }

        return $out;
    }

    /**
     * Generate 16 char randomness dari random_bytes.
     */
    private static function encodeRandom(int $length): string
    {
        try {
            $bytes = random_bytes($length);
        } catch (\Throwable $e) {
            throw new RuntimeException('Could not generate random bytes', 0, $e);
        }

        $out = '';
        for ($i = 0; $i < $length; $i++) {
            $out .= self::ALPHABET[ord($bytes[$i]) % 32];
        }

        return $out;
    }

    private static function validatePrefix(string $prefix): void
    {
        if (! array_key_exists($prefix, self::PREFIX_MAP)) {
            throw new InvalidArgumentException(
                "Unknown ULID prefix '{$prefix}'. "
                . 'Registered: ' . implode(', ', array_keys(self::PREFIX_MAP))
            );
        }
    }
}