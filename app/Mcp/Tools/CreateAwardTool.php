<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateAward')]
#[Description('Record an award. person_id and award_id are the dashboard\'s verification identifiers (unique per pair); names and date are as on the certificate.')]
class CreateAwardTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardAwardController::class;

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
            'person_id' => $schema->string()->description('Certificate person identifier.')->required(),
            'award_id' => $schema->string()->description('Certificate award identifier (unique with person_id).')->required(),
            'full_name' => $schema->string()->description('Awardee full name as on the certificate.')->required(),
            'father_name' => $schema->string()->description('Father name as on the certificate.'),
            'awarded_at' => $schema->string()->description('Award date.')->required(),
        ];
    }
}
