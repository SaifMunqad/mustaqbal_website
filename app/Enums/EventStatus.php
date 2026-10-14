<?php

namespace App\Enums;

enum EventStatus: string
{
    case Upcoming = 'upcoming';
    case Ongoing = 'ongoing';
    case Past = 'past';
    case Cancelled = 'cancelled';

    public static function values(): array
    {
        return array_map(static fn (self $status): string => $status->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Upcoming => 'Upcoming',
            self::Ongoing => 'Ongoing',
            self::Past => 'Past',
            self::Cancelled => 'Cancelled',
        };
    }

    public function labelKey(): string
    {
        return "enums.eventStatus.{$this->value}";
    }
}
