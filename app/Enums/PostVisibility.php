<?php

namespace App\Enums;

enum PostVisibility: string
{
    case Public = 'public';
    case Community = 'community';

    public static function values(): array
    {
        return array_map(static fn (self $visibility): string => $visibility->value, self::cases());
    }
}

