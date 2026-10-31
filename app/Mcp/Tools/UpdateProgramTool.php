<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateProgram')]
#[Description('Update an existing program. Provide the program id plus the fields to change.')]
class UpdateProgramTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardProgramController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['program'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'program' => $schema->integer()->description('The program id.')->required(),
        ];
    }
}
