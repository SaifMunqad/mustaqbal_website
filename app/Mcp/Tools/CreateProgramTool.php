<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;

#[Name('CreateProgram')]
#[Description('Create a program. Text lives in "translations" per active language code (name, description, schedule and age_recommendation are required for the default language).')]
class CreateProgramTool extends DashboardTool
{
    protected string $controller = \App\Http\Controllers\Dashboard\DashboardProgramController::class;

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
            'program_type' => $schema->string()->enum(['school', 'courses', 'islamic_madrasa'])->description('Which catalog the program belongs to.')->required(),
            'fees' => $schema->number()->description('Program fees (0 or more).')->required(),
            'available_for_enroll' => $schema->boolean()->description('Whether the public enrol form accepts signups.'),
            'display_order' => $schema->integer()->description('Ordering within the catalog.'),
            'translations' => $schema->object()->description('Language code => {name, description, schedule, age_recommendation, classroom_number}.'),
        ];
    }
}
