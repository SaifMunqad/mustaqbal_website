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
    case TeacherOfMonth = 'teacher_of_month';
    case EmployeeOfMonth = 'employee_of_month';

    public function isTeacherOwned(): bool
    {
        return in_array($this, [self::Achievement, self::StudentOfWeek, self::StudentOfMonth], true);
    }

    public function isManagementOwned(): bool
    {
        return in_array($this, [
            self::News,
            self::Job,
            self::Event,
            self::TeacherOfMonth,
            self::EmployeeOfMonth,
        ], true);
    }

    /**
     * Types used for the student/teacher/employee recognition showcase.
     */
    public function isRecognition(): bool
    {
        return in_array($this, [
            self::StudentOfWeek,
            self::StudentOfMonth,
            self::TeacherOfMonth,
            self::EmployeeOfMonth,
        ], true);
    }

    public static function recognitionTypes(): array
    {
        return [
            self::StudentOfWeek,
            self::StudentOfMonth,
            self::TeacherOfMonth,
            self::EmployeeOfMonth,
        ];
    }

    public function label(): string
    {
        return match ($this) {
            self::News => 'News',
            self::Job => 'Job',
            self::Event => 'Event',
            self::Achievement => 'Achievement',
            self::StudentOfWeek => 'Student of the Week',
            self::StudentOfMonth => 'Student of the Month',
            self::TeacherOfMonth => 'Teacher of the Month',
            self::EmployeeOfMonth => 'Employee of the Month',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            static fn (self $type): array => ['value' => $type->value, 'label' => $type->label()],
            self::cases(),
        );
    }

    public static function values(): array
    {
        return array_map(static fn (self $type): string => $type->value, self::cases());
    }
}

