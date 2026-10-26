<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\AssignLanguageFontRequest;
use App\Http\Requests\Dashboard\StoreFontRequest;
use App\Models\Font;
use App\Models\Language;
use App\Support\Typography\GoogleFonts;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DashboardFontController extends Controller
{
    /**
     * Weights the uploader accepts, one file each: files[400] … files[700].
     * Shipping the real bold weight keeps the browser from synthesising it.
     *
     * @var list<int>
     */
    public const WEIGHTS = [400, 500, 600, 700];

    /**
     * Store a font family and its files.
     *
     * Files land in `storage/app/public/fonts/{slug}/{weight}.{ext}`, so the
     * public URL is stable and the browser cache is busted only through the
     * `?v=` stamp {@see Font::publicUrl()} adds.
     */
    public function store(StoreFontRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $uploaded = array_filter(
            $validated['files'] ?? [],
            static fn (mixed $file): bool => $file instanceof UploadedFile,
        );

        if ($uploaded === []) {
            throw ValidationException::withMessages([
                'files' => 'Upload at least the regular (400) weight of the family.',
            ]);
        }

        foreach (array_keys($uploaded) as $weight) {
            if (! in_array((int) $weight, self::WEIGHTS, true)) {
                throw ValidationException::withMessages([
                    'files' => 'Unsupported font weight "'.$weight.'".',
                ]);
            }
        }

        $slug = Str::slug($validated['name']);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'name' => 'Use letters or numbers in the family name.',
            ]);
        }

        if (Font::query()->where('slug', $slug)->exists()) {
            throw ValidationException::withMessages([
                'name' => 'A font family with this name already exists.',
            ]);
        }

        DB::transaction(function () use ($request, $validated, $uploaded, $slug): void {
            $font = Font::query()->create([
                'name' => $validated['name'],
                'slug' => $slug,
                'created_by' => $request->user()?->id,
            ]);

            foreach ($uploaded as $weight => $file) {
                $extension = strtolower($file->getClientOriginalExtension());

                $font->files()->create([
                    'weight' => (int) $weight,
                    'style' => 'normal',
                    'path' => $file->storeAs($font->directory(), $weight.'.'.$extension, 'public'),
                    'format' => self::formatFor($extension),
                ]);
            }
        });

        return back()->with('success', 'flash.fontUploaded');
    }

    /**
     * Remove a family and its files. Refused while a language still points at
     * it, so no language silently loses its typeface.
     */
    public function destroy(Font $font): RedirectResponse
    {
        if ($font->languages()->exists()) {
            return back()->with('error', 'flash.fontInUse');
        }

        $font->deleteFiles();
        $font->delete();

        return back()->with('success', 'flash.fontDeleted');
    }

    /**
     * Point one language at a typeface, or clear it to fall back to the built-in
     * Noto Naskh Arabic stack.
     *
     * A language has exactly one source, so the selection is a single opaque
     * value: `default`, `google:{key}` or `font:{id}`. Assigning one kind clears
     * the other column.
     */
    public function assign(AssignLanguageFontRequest $request, Language $language): RedirectResponse
    {
        $validated = $request->validated();

        $selection = $validated['selection'];

        if ($selection === 'default') {
            $language->update(['font_family_id' => null, 'google_font' => null]);

            return back()->with('success', 'flash.languageFontUpdated');
        }

        if (str_starts_with($selection, 'google:')) {
            $key = substr($selection, strlen('google:'));

            if (! GoogleFonts::has($key)) {
                throw ValidationException::withMessages([
                    'selection' => 'Unknown Google Font.',
                ]);
            }

            $language->update(['google_font' => $key, 'font_family_id' => null]);

            return back()->with('success', 'flash.languageFontUpdated');
        }

        if (str_starts_with($selection, 'font:')) {
            $font = Font::query()->find((int) substr($selection, strlen('font:')));

            if ($font === null) {
                throw ValidationException::withMessages([
                    'selection' => 'This font family no longer exists.',
                ]);
            }

            $language->update(['font_family_id' => $font->id, 'google_font' => null]);

            return back()->with('success', 'flash.languageFontUpdated');
        }

        throw ValidationException::withMessages([
            'selection' => 'Unknown font selection.',
        ]);
    }

    /**
     * CSS `format()` keyword for an extension.
     */
    public static function formatFor(string $extension): string
    {
        return match (strtolower($extension)) {
            'woff2' => 'woff2',
            'woff' => 'woff',
            'otf' => 'opentype',
            default => 'truetype',
        };
    }
}
