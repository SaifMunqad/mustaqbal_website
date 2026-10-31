<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateUser')]
#[Description('Create an account (admin). Provide name, email, role, status and optionally a password.')]
class CreateUserTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardUserController::class;

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
            'name' => $schema->string()->description('Display name.')->required(),
            'email' => $schema->string()->description('Unique login email.')->required(),
            'role' => $schema->string()->enum(\App\Enums\UserRole::values())->description('Account role; the dashboard only lets you grant roles below your own.')->required(),
            'status' => $schema->string()->enum(\App\Enums\UserStatus::values())->description('Account status (active by default).'),
            'password' => $schema->string()->description('Min 8 characters; must be sent as password + password_confirmation in one payload.'),
            'password_confirmation' => $schema->string()->description('Must match password when a password is set.'),
        ];
    }
}
