<?php

namespace App\Enums;

enum PostType: string
{
    case News = 'news';
    case Job = 'job';
    case Event = 'event';
    case Achievement = 'achievement';
    case StudentOfWeek = 'student_of_week';
    case StudentOfMonth = 'student_of_month';

    public function isTeacherOwned(): bool
    {
        return in_array($this, [self::Achievement, self::StudentOfWeek, self::StudentOfMonth], true);
    }

    public function isManagementOwned(): bool
    {
        return in_array($this, [self::News, self::Job, self::Event], true);
    }

    public static function values(): array
    {
        return array_map(static fn (self $type): string => $type->value, self::cases());
    }
}

