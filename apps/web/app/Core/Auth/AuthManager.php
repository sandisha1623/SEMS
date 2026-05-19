<?php

namespace App\Core\Auth;

class AuthManager
{
    public function check(): bool
    {
        return session()->has('user');
    }

    public function user(): ?array
    {
        return session('user');
    }

    public function id(): ?int
    {
        return session('user.id');
    }

    public function role(): ?string
    {
        return session('user.role');
    }

    public function hasRole(string|array $roles): bool
    {
        $userRole = $this->role();

        if (!$userRole) {
            return false;
        }

        return in_array($userRole, (array) $roles);
    }

    public function hasPermission(string $permission): bool
    {
        $permissions = session('user.permissions') ?? [];

        return in_array($permission, $permissions);
    }
}