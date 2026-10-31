<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('UpdateContact')]
#[Description('Update a contact record.')]
class UpdateContactTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardContactController::class;

    protected string $action = 'update';

    protected string $verb = 'PUT';

    /** @var array<int, string> */
    protected array $models = ['contact'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'contact' => $schema->integer()->description('The contact id.')->required(),
        ];
    }
}
