<?php

namespace App\Enums;

enum UserRole: string
{
    case Family = 'family';
    case Teacher = 'teacher';
    case Management = 'management';

    public static function values(): array
    {
        return array_map(static fn (self $role): string => $role->value, self::cases());
    }
}

