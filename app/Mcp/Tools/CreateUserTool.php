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
}
