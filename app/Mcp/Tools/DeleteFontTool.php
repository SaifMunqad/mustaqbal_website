<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('DeleteFont')]
#[Description('Delete an uploaded font family and its files. Refused while a language still uses it, exactly as in the dashboard.')]
class DeleteFontTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardFontController::class;

    protected string $action = 'destroy';

    protected string $verb = 'DELETE';

    /** @var array<int, string> */
    protected array $models = ['font'];

    /**
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(\Illuminate\Contracts\JsonSchema\JsonSchema $schema): array
    {
        return [
            'font' => $schema->integer()->description('The font family id (listed by GetSiteSettings under fonts).')->required(),
        ];
    }
}
