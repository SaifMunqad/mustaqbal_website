<?php

namespace App\Enums;

enum EnrollmentStatus: string
{
    case New = 'new';
    case Reviewed = 'reviewed';
    case Messaged = 'messaged';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case OnHold = 'on_hold';

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
            self::New => 'New',
            self::Reviewed => 'Reviewed',
            self::Messaged => 'Messaged',
            self::Accepted => 'Accepted',
            self::Rejected => 'Rejected',
            self::OnHold => 'On hold',
        };
    }

    public function labelKey(): string
    {
        return "enums.enrollmentStatus.{$this->value}";
    }
}
