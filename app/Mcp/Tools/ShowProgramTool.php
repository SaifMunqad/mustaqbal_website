<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ShowProgram')]
#[IsReadOnly]
#[Description('Read a single program with its full editable fields, including per-language rows (the dashboard edit screen data).')]
class ShowProgramTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardProgramController::class;

    protected string $action = 'edit';

    protected string $verb = 'GET';

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
