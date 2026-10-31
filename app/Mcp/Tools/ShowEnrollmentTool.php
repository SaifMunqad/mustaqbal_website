<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('ShowEnrollment')]
#[IsReadOnly]
#[Description('Read a single enrollment enquiry with its replies.')]
class ShowEnrollmentTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardEnrollmentController::class;

    protected string $action = 'show';

    protected string $verb = 'GET';

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
