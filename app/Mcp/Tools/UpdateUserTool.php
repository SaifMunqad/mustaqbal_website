<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateUser')]
#[Description('Update an account.')]
class UpdateUserTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardUserController::class;

    protected string $action = 'update';

    protected string $verb = 'PATCH';

    /** @var array<int, string> */
    protected array $models = ['user'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'user' => $schema->integer()->description('The user id.')->required(),
        ];
    }
}
