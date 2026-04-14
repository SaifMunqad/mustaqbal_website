<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardProgramController extends Controller
{
    public function index(): Response
    {
        $locale = app()->getLocale();

        $programs = Program::query()
            ->with(['translations.language', 'typeTranslations.language'])
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate(20)
            ->through(fn (Program $program): array => [
                'id' => $program->id,
                'name' => $program->translatedName($locale),
                'program_type' => $program->program_type,
                'program_type_label' => $program->translatedProgramType($locale),
                'schedule' => $program->schedule,
                'fees' => $program->fees,
                'available_for_enroll' => $program->available_for_enroll,
            ]);

        return Inertia::render('dashboard/programs/index', [
            'programs' => $programs,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/programs/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'program_type' => ['required', 'in:school,courses,islamic_madrasa'],
            'description' => ['required', 'string'],
            'schedule' => ['required', 'string', 'max:255'],
            'fees' => ['required', 'numeric', 'min:0'],
            'age_recommendation' => ['required', 'string', 'max:255'],
            'classroom_number' => ['nullable', 'string', 'max:100'],
            'available_for_enroll' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $program = Program::query()->create([
            ...$validated,
            'available_for_enroll' => ! empty($validated['available_for_enroll']),
            'display_order' => $validated['display_order'] ?? 0,
        ]);

        $program->syncDefaultTranslation();

        return redirect()
            ->route('dashboard.programs.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Program created successfully.']);
    }

    public function edit(Program $program): Response
    {
        return Inertia::render('dashboard/programs/edit', [
            'program' => $program,
        ]);
    }

    public function update(Request $request, Program $program): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'program_type' => ['required', 'in:school,courses,islamic_madrasa'],
            'description' => ['required', 'string'],
            'schedule' => ['required', 'string', 'max:255'],
            'fees' => ['required', 'numeric', 'min:0'],
            'age_recommendation' => ['required', 'string', 'max:255'],
            'classroom_number' => ['nullable', 'string', 'max:100'],
            'available_for_enroll' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $program->update([
            ...$validated,
            'available_for_enroll' => ! empty($validated['available_for_enroll']),
            'display_order' => $validated['display_order'] ?? 0,
        ]);

        $program->syncDefaultTranslation();

        return redirect()
            ->route('dashboard.programs.index')
            ->with('toast', ['variant' => 'success', 'title' => 'Program updated successfully.']);
    }
}

