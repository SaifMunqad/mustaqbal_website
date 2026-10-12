<?php

namespace App\Enums;

enum EventAudience: string
{
    case Public = 'public';
    case Families = 'families';
    case Teachers = 'teachers';

    public static function values(): array
    {
        return array_map(static fn (self $audience): string => $audience->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Public => 'Public',
            self::Families => 'Families',
            self::Teachers => 'Teachers',
        };
    }
}
