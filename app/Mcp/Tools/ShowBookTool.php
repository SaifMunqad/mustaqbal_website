<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ShowBook')]
#[IsReadOnly]
#[Description('Read a single book with its full editable fields, including cover, PDF paths and per-language rows (the dashboard edit screen data).')]
class ShowBookTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardBookController::class;

    protected string $action = 'edit';

    protected string $verb = 'GET';

    /** @var array<int, string> */
    protected array $models = ['book'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'book' => $schema->integer()->description('The book id.')->required(),
        ];
    }
}
