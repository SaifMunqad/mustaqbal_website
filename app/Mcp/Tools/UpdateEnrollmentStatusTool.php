<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateEnrollmentStatus')]
#[Description('Change an enrollment\'s status. Provide status (new, reviewed, messaged, ...).')]
class UpdateEnrollmentStatusTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardEnrollmentController::class;

    protected string $action = 'updateStatus';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['enrollment'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'enrollment' => $schema->integer()->description('The enrollment id.')->required(),
        ];
    }
}
