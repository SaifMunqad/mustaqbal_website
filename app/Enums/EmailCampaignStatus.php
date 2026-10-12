<?php

namespace App\Enums;

enum EmailCampaignStatus: string
{
    case Queued = 'queued';
    case Completed = 'completed';

    public static function values(): array
    {
        return array_map(static fn (self $status): string => $status->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Queued => 'Queued',
            self::Completed => 'Completed',
        };
    }
}
