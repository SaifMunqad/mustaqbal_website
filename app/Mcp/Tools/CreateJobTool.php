<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateJob')]
#[Description('Create a job posting. Text lives in "translations" per active language code (title and description are required for the default language).')]
class CreateJobTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardJobController::class;

    protected string $action = 'store';

    protected string $verb = 'POST';

    /** @var array<int, string> */
    protected array $models = [];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'employment_type' => $schema->string()->enum(['full_time', 'part_time', 'contract'])->description('Contract shape.')->required(),
            'category' => $schema->string()->enum(['school', 'course', 'islamic_madrasa'])->description('Optional hiring category.'),
            'working_hours' => $schema->string()->description('Free-text schedule.'),
            'application_email' => $schema->string()->description('Where applications are emailed.'),
            'application_url' => $schema->string()->description('Where applications are submitted.'),
            'deadline' => $schema->string()->description('Application deadline.'),
            'is_active' => $schema->boolean()->description('Whether the posting is open.'),
            'translations' => $schema->object()->description('Language code => {title, department, description, requirements}.'),
        ];
    }
}
