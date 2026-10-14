<?php

namespace Tests\Feature;

use App\Enums\EmailCampaignStatus;
use App\Enums\EmailDeliveryStatus;
use App\Enums\EventAudience;
use App\Enums\EventStatus;
use App\Enums\HomeSectionType;
use App\Enums\PostType;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use Tests\TestCase;

/**
 * Guards the enum -> i18n key contract (Strategy A): every enum case exposes a
 * labelKey() of the form "enums.<group>.<value>", and the frontend English
 * locale must define that key. Catches drift when a case is added without a
 * matching translation entry. English label() is the runtime fallback, so this
 * is a completeness guard, not a hard failure path.
 */
class EnumTranslationKeysTest extends TestCase
{
    /**
     * @return list<class-string>
     */
    private function enums(): array
    {
        return [
            PostType::class,
            HomeSectionType::class,
            EventAudience::class,
            EventStatus::class,
            UserRole::class,
            UserStatus::class,
            EmailCampaignStatus::class,
            EmailDeliveryStatus::class,
        ];
    }

    public function test_every_enum_case_label_key_is_defined_in_the_english_locale(): void
    {
        $locale = file_get_contents(resource_path('js/i18n/locales/en.ts'));
        $this->assertNotFalse($locale, 'The English locale file must exist and be readable.');

        $start = strpos($locale, 'enums: {');
        $this->assertNotFalse($start, 'en.ts must declare an "enums" namespace.');

        $rest = substr($locale, $start);
        $end = strpos($rest, "\n    jobs: {");
        $this->assertNotFalse($end, 'Could not find the end of the "enums" block in en.ts.');

        $enumsBlock = substr($rest, 0, $end);

        // group => set of enum values
        $expected = [];
        foreach ($this->enums() as $enumClass) {
            foreach ($enumClass::cases() as $case) {
                $parts = explode('.', $case->labelKey());
                $this->assertCount(3, $parts, "Unexpected labelKey format on {$enumClass}: {$case->value}");
                [$namespace, $group, $value] = $parts;
                $this->assertSame('enums', $namespace);
                $expected[$group][$value] = true;
            }
        }

        $this->assertNotEmpty($expected, 'No enum cases were discovered.');

        foreach ($expected as $group => $values) {
            $groupStart = strpos($enumsBlock, $group.': {');
            $this->assertNotFalse($groupStart, "en.ts enums block is missing the '$group' group.");

            $groupBlock = substr($enumsBlock, $groupStart);

            foreach (array_keys($values) as $value) {
                $pattern = '/(^|[^A-Za-z0-9_])'.preg_quote($value, '/').'\s*:/';
                $this->assertMatchesRegularExpression(
                    $pattern,
                    $groupBlock,
                    "Missing translation key 'enums.$group.$value' in en.ts."
                );
            }
        }
    }
}
