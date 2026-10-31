<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ListJobApplications')]
#[IsReadOnly]
#[Description('List job applications, optionally filtered by a single job.')]
class ListJobApplicationsTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\JobApplicationController::class;

    protected string $action = 'index';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = ['job'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'job' => $schema->integer()->description('Restrict to a single job id.'),
        ];
    }
}
