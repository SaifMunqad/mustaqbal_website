<?php

namespace Tests\Feature;

use App\Http\Middleware\SetLocale;
use App\Models\Language;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

/**
 * Guards the locale-resolution contract of {@see SetLocale}:
 *
 *  1. No cached language          -> the site default (`is_default` row).
 *  2. Unsupported cached language -> the site default again.
 *  3. Deactivated cached language -> the site default again.
 *  4. Valid cached language        -> the cached language.
 *
 * The middleware is invoked directly so the assertion reflects pure resolution
 * logic, independent of the test HTTP layer's cookie encryption. The default is
 * intentionally NOT the highest-priority active language (`en` sorts first,
 * `fa_AF` is the default), so reverting the fallback to `firstActiveCode()`
 * fails these assertions.
 */
class LocaleResolutionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Language::flushCache();

        Language::query()->updateOrCreate(
            ['code' => 'en'],
            ['name' => 'English', 'dir' => 'ltr', 'is_active' => true, 'is_default' => false, 'sort_order' => 1],
        );
        Language::query()->updateOrCreate(
            ['code' => 'fa_AF'],
            ['name' => 'Dari', 'dir' => 'rtl', 'is_active' => true, 'is_default' => true, 'sort_order' => 2],
        );
        Language::query()->updateOrCreate(
            ['code' => 'ps'],
            ['name' => 'Pashto', 'dir' => 'rtl', 'is_active' => true, 'is_default' => false, 'sort_order' => 3],
        );
    }

    public function test_new_visitor_is_served_the_default_language_not_the_first_active(): void
    {
        $this->assertSame('fa_AF', $this->resolveLocaleForCookie(null));
    }

    public function test_unsupported_cached_language_falls_back_to_the_default(): void
    {
        $this->assertSame('fa_AF', $this->resolveLocaleForCookie('zz'));
    }

    public function test_disabled_cached_language_falls_back_to_the_default(): void
    {
        Language::query()->where('code', 'ps')->update(['is_active' => false]);
        Language::flushCache();

        $this->assertSame('fa_AF', $this->resolveLocaleForCookie('ps'));
    }

    public function test_valid_cached_language_is_respected(): void
    {
        $this->assertSame('ps', $this->resolveLocaleForCookie('ps'));
    }

    public function test_response_caches_the_resolved_default_for_a_new_visitor(): void
    {
        $response = $this->handle($this->requestWithCookie(null));

        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === SetLocale::COOKIE);

        $this->assertNotNull($cookie);
        $this->assertSame('fa_AF', $cookie->getValue());
    }

    /**
     * Run the middleware for a request carrying the given cookie value and
     * return the resolved application locale.
     */
    private function resolveLocaleForCookie(?string $cookie): string
    {
        $this->handle($this->requestWithCookie($cookie));

        return app()->getLocale();
    }

    private function requestWithCookie(?string $cookie): Request
    {
        $request = Request::create('/', 'GET');

        if ($cookie !== null) {
            $request->cookies->set(SetLocale::COOKIE, $cookie);
        }

        return $request;
    }

    private function handle(Request $request): Response
    {
        return (new SetLocale)->handle($request, fn () => new Response);
    }
}
