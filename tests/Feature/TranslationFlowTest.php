<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Language;
use App\Support\Translation\TranslationPayload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Exercises the full content-translation flow against the real (migrated)
 * schema: localized writes via TranslationPayload, per-locale reads through the
 * model appends, graceful fallback, and localized search — using events as the
 * representative resource.
 */
class TranslationFlowTest extends TestCase
{
    use RefreshDatabase;

    private Language $en;

    private Language $ps;

    protected function setUp(): void
    {
        parent::setUp();

        $this->en = $this->language('en', true);
        $this->ps = $this->language('ps', false);

        Language::flushCache();
    }

    public function test_it_writes_per_language_rows_and_reads_the_active_locale(): void
    {
        $event = $this->makeEvent();

        TranslationPayload::apply($event->translations(), [
            'en' => ['title' => 'Science Fair', 'body' => 'A fair about science.'],
            'ps' => ['title' => 'د ساینس نندارتون', 'body' => 'د ساینس نندارتون.'],
        ]);

        $event = $event->fresh(['translations.language']);

        app()->setLocale('ps');
        $this->assertSame('د ساینس نندارتون', $event->title);
        $this->assertSame('د ساینس نندارتون.', $event->body);

        app()->setLocale('en');
        $this->assertSame('Science Fair', $event->title);
    }

    public function test_serialized_model_reflects_the_current_locale(): void
    {
        $event = $this->makeEvent();

        TranslationPayload::apply($event->translations(), [
            'en' => ['title' => 'Science Fair'],
            'ps' => ['title' => 'د ساینس نندارتون'],
        ]);

        app()->setLocale('ps');

        $serialized = $event->fresh(['translations.language'])->toArray();

        $this->assertSame('د ساینس نندارتون', $serialized['title']);
        // Non-translatable columns remain on the serialized payload.
        $this->assertArrayHasKey('slug', $serialized);
    }

    public function test_it_falls_back_to_the_default_language_when_locale_is_missing(): void
    {
        $event = $this->makeEvent();

        // Only an English row exists.
        TranslationPayload::apply($event->translations(), [
            'en' => ['title' => 'Reading Week'],
        ]);

        app()->setLocale('ps');

        $this->assertSame('Reading Week', $event->fresh(['translations.language'])->title);
    }

    public function test_search_matches_only_the_requested_language_translations(): void
    {
        $english = $this->makeEvent(['slug' => 'english-only-event']);
        TranslationPayload::apply($english->translations(), [
            'en' => ['title' => 'Chemistry Lab Open Day'],
        ]);

        $pashto = $this->makeEvent(['slug' => 'pashto-only-event']);
        TranslationPayload::apply($pashto->translations(), [
            'ps' => ['title' => 'د کیمیاوي لابراتوار ورځ'],
        ]);

        // Searching the Pashto phrase under Pashto finds only the Pashto event.
        $found = Event::query()->search('کیمیاوي', 'ps')->pluck('slug')->all();
        $this->assertSame(['pashto-only-event'], $found);

        // The same Pashto term finds nothing under English.
        $this->assertCount(0, Event::query()->search('کیمیاوي', 'en')->get());

        // English term finds the English event under English locale.
        $this->assertSame(['english-only-event'], Event::query()->search('Chemistry', 'en')->pluck('slug')->all());
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function makeEvent(array $attributes = []): Event
    {
        return Event::query()->create(array_merge([
            'slug' => 'event-'.Str::lower(Str::random(6)),
            'start_at' => now()->addDay(),
            'audience' => 'public',
            'is_published' => true,
        ], $attributes));
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
