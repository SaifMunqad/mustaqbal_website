<?php

namespace Tests\Feature;

use App\Models\Language;
use App\Models\Program;
use App\Models\ProgramTranslation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HasTranslationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Language::flushCache();
    }

    public function test_sync_default_translation_creates_a_row_for_the_default_language(): void
    {
        $english = $this->language('en', true);

        $program = Program::query()->create([
            'name' => 'Robotics',
            'program_type' => 'courses',
            'description' => 'Build robots.',
            'schedule' => 'Sat',
            'fees' => 100,
            'age_recommendation' => '10+',
        ]);

        $program->syncDefaultTranslation();

        $this->assertDatabaseHas('program_translations', [
            'program_id' => $program->id,
            'language_id' => $english->id,
            'name' => 'Robotics',
            'description' => 'Build robots.',
        ]);
    }

    public function test_translated_falls_back_to_default_language_when_locale_missing(): void
    {
        $english = $this->language('en', true);
        $pashto = $this->language('ps', false);

        $program = Program::query()->create([
            'name' => 'Robotics',
            'program_type' => 'courses',
            'description' => 'Build robots.',
            'schedule' => 'Sat',
            'fees' => 100,
            'age_recommendation' => '10+',
        ]);

        $program->syncDefaultTranslation();

        // Only an English row exists; asking for Pashto must fall back to English.
        $this->assertSame('Robotics', $program->translated('name', 'ps'));

        // Adding a Pashto row makes it resolve directly.
        ProgramTranslation::query()->create([
            'program_id' => $program->id,
            'language_id' => $pashto->id,
            'name' => 'روباتیک',
            'description' => 'روبोट جوړ کړئ.',
        ]);

        // Reload to drop the cached relation so the new row is picked up.
        $program = $program->fresh(['translations.language']);

        $this->assertSame('روباتیک', $program->translated('name', 'ps'));
        $this->assertSame('Robotics', $program->translated('name', 'en'));

        $english->delete();
        $pashto->delete();
    }

    public function test_translation_class_is_derived_by_convention(): void
    {
        $this->assertSame(ProgramTranslation::class, Program::translationClass());
    }

    private function language(string $code, bool $isDefault): Language
    {
        return Language::query()->create([
            'code' => $code,
            'name' => strtoupper($code),
            'dir' => 'ltr',
            'is_active' => true,
            'is_default' => $isDefault,
            'sort_order' => $isDefault ? 0 : 1,
        ]);
    }
}
