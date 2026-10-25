<?php

namespace App\Enums;

enum JobApplicationStatus: string
{
    case Pending = 'pending';
    case Read = 'read';
    case Selected = 'selected';
    case Rejected = 'rejected';
    case Queued = 'queued';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $status): string => $status->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Read => 'Read',
            self::Selected => 'Selected',
            self::Rejected => 'Rejected',
            self::Queued => 'Queued',
        };
    }

    public function labelKey(): string
    {
        return "enums.jobApplicationStatus.{$this->value}";
    }
}
