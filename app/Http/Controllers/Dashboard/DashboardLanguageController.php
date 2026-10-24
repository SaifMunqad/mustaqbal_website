<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Language;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', 'alpha_dash', 'unique:languages,code'],
            'name' => ['required', 'string', 'max:255'],
            'dir' => ['required', 'in:ltr,rtl'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $language = Language::query()->create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'dir' => $validated['dir'],
            'is_active' => ! empty($validated['is_active']),
            'is_default' => false,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return redirect()
            ->route('dashboard.languages.index')
            ->with('toast', ['variant' => 'success', 'title' => "Language {$language->name} created."]);
    }

    public function update(Request $request, Language $language): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'dir' => ['required', 'in:ltr,rtl'],
            'is_active' => ['nullable', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $language->update([
            'name' => $validated['name'],
            'dir' => $validated['dir'],
            'is_active' => ! empty($validated['is_active']),
            'is_default' => ! empty($validated['is_default']),
            'sort_order' => $validated['sort_order'] ?? $language->sort_order,
        ]);

        $language->makeDefault();

        return redirect()
            ->route('dashboard.languages.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Language updated.']);
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['required', 'integer', 'exists:languages,id'],
        ]);

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
