<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('ReplyEnrollment')]
#[Description('Reply to an enrollment enquiry (emails the guardian). Provide body (HTML) and an optional subject.')]
class ReplyEnrollmentTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardEnrollmentController::class;

    protected string $action = 'storeReply';

    protected string $verb = 'POST';

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
