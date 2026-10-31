<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateJob')]
#[Description('Update an existing job posting. Provide the job id plus the fields to change.')]
class UpdateJobTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardJobController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['job'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'job' => $schema->integer()->description('The job id.')->required(),
        ];
    }
}
