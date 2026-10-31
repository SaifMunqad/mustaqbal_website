<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\ReorderLanguagesRequest;
use App\Http\Requests\Dashboard\StoreLanguageRequest;
use App\Http\Requests\Dashboard\UpdateLanguageRequest;
use App\Models\Language;
use App\Support\Translation\LanguageCatalog;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DashboardLanguageController extends Controller
{
    public function index(): Response
    {
        $languages = Language::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Language $language): array => [
                'id' => $language->id,
                'code' => $language->code,
                'name' => $language->name,
                'dir' => $language->dir,
                'is_active' => $language->is_active,
                'is_default' => $language->is_default,
                'sort_order' => $language->sort_order,
            ]);

        return Inertia::render('dashboard/languages/dashboard-languages-index', [
            'languages' => $languages,
            // Curated catalog minus the languages already configured, so the
            // create form searches a fixed list instead of free-text code/name.
            'languageOptions' => LanguageCatalog::available($languages->pluck('code')->all()),
        ]);
    }

    public function store(StoreLanguageRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // The picker only offers curated languages, so the catalog is the source
        // of truth for the display name and text direction. The submitted values
        // remain a fallback for codes outside the catalog.
        $option = LanguageCatalog::find($validated['code']);

        $language = Language::query()->create([
            'code' => $validated['code'],
            'name' => $option['name'] ?? $validated['name'] ?? $validated['code'],
            'dir' => $option['dir'] ?? $validated['dir'] ?? 'ltr',
            // A language the admin adds is meant to be usable right away; it can
            // be switched off later from the row's status toggle.
            'is_active' => true,
            'is_default' => false,
            // Append new languages below the existing ones instead of jumping to
            // the top of the ordered list.
            'sort_order' => $validated['sort_order'] ?? ((int) Language::query()->max('sort_order') + 1),
        ]);

        return redirect()
            ->route('dashboard.languages.index')
            ->with('toast', ['variant' => 'success', 'title' => "Language {$language->name} created."]);
    }

    public function update(UpdateLanguageRequest $request, Language $language): RedirectResponse
    {
        $validated = $request->validated();

        // The name and text direction are catalog-derived and stay read-only in
        // the dashboard, so only the flags and order are taken from the request.
        // (Re-syncing them also repairs a row whose code predates the catalog.)
        $option = LanguageCatalog::find($language->code);

        $language->update([
            'name' => $option['name'] ?? $language->name,
            'dir' => $option['dir'] ?? $language->dir,
            'is_active' => ! empty($validated['is_active']),
            'is_default' => ! empty($validated['is_default']),
            'sort_order' => $validated['sort_order'] ?? $language->sort_order,
        ]);

        $language->makeDefault();

        return redirect()
            ->route('dashboard.languages.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Language updated.']);
    }

    public function reorder(ReorderLanguagesRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        foreach ($validated['order'] as $index => $id) {
            Language::query()->whereKey($id)->update(['sort_order' => $index]);
        }

        return back()->with('toast', ['variant' => 'success', 'title' => 'Language order saved.']);
    }

    public function destroy(Language $language): RedirectResponse
    {
        if ($language->is_default) {
            return redirect()
                ->route('dashboard.languages.index')
                ->with('toast', ['variant' => 'error', 'title' => 'The default language cannot be deleted.']);
        }

        $language->delete();

        return redirect()
            ->route('dashboard.languages.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Language deleted.']);
    }
}
