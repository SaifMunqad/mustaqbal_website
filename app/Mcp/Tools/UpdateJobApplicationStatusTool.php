<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateJobApplicationStatus')]
#[Description('Change a job application\'s status.')]
class UpdateJobApplicationStatusTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\JobApplicationController::class;

    protected string $action = 'updateStatus';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['application'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'application' => $schema->integer()->description('The job application id.')->required(),
        ];
    }
}
