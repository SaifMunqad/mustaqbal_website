<?php

namespace App\Enums;

enum WhatsAppCampaignStatus: string
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

    public function labelKey(): string
    {
        return "enums.whatsappCampaignStatus.{$this->value}";
    }
}
