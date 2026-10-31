<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ShowJobApplication')]
#[IsReadOnly]
#[Description('Read a single job application.')]
class ShowJobApplicationTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\JobApplicationController::class;

    protected string $action = 'show';

    protected string $verb = 'GET';

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
