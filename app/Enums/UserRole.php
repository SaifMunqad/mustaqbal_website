<?php

namespace App\Enums;

enum UserRole: string
{
    case Family = 'family';
    case Teacher = 'teacher';
    case Management = 'management';
    case Admin = 'admin';

    public static function values(): array
    {
        return array_map(static fn (self $role): string => $role->value, self::cases());
    }

    /**
     * Rank of the role, used for hierarchy checks (admin > management > teacher > family).
     */
    public function level(): int
    {
        return match ($this) {
            self::Family => 1,
            self::Teacher => 2,
            self::Management => 3,
            self::Admin => 4,
        };
    }

    public function atLeast(self $role): bool
    {
        return $this->level() >= $role->level();
    }

    public function label(): string
    {
        return match ($this) {
            self::Family => 'Family',
            self::Teacher => 'Teacher',
            self::Management => 'Management',
            self::Admin => 'Admin',
        };
    }

    public function labelKey(): string
    {
        return "enums.userRole.{$this->value}";
    }
}

