<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('DeleteAward')]
#[Description('Delete an award record (admin role only, mirroring the dashboard route).')]
class DeleteAwardTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardAwardController::class;

    protected string $action = 'destroy';

    protected string $verb = 'DELETE';

    /** @var array<int, string> */
    protected array $models = ['award'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'award' => $schema->integer()->description('The award id.')->required(),
        ];
    }
}
