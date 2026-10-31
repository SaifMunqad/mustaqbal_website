<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('DeleteJob')]
#[Description('Delete a job posting and its applications.')]
class DeleteJobTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardJobController::class;

    protected string $action = 'destroy';

    protected string $verb = 'DELETE';

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
