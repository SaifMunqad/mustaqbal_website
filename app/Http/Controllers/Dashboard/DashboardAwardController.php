<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Award;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardAwardController extends Controller
{
    /**
     * Upper bound for one spreadsheet import. The file itself is parsed in the
     * browser (see resources/js/components/dashboard/awards), so this guards
     * the JSON payload the browser posts back.
     */
    public const MAX_IMPORT_ROWS = 2000;

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $awards = Award::query()
            ->search($search)
            ->orderByDesc('awarded_at')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Award $award): array => $award->toRow());

        return Inertia::render('dashboard/awards/dashboard-awards-index', [
            'awards' => $awards,
            'filters' => ['search' => $search],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('dashboard/awards/dashboard-awards-create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->normalizeCodes($request);

        $validated = $request->validate($this->rules($request));

        Award::query()->create($validated);

        return redirect()
            ->route('dashboard.awards.index')
            ->with('success', 'flash.awardCreated');
    }

    public function edit(Award $award): Response
    {
        return Inertia::render('dashboard/awards/dashboard-awards-edit', [
            'award' => $award->toRow(),
        ]);
    }

    public function update(Request $request, Award $award): RedirectResponse
    {
        $this->normalizeCodes($request);

        $validated = $request->validate($this->rules($request, $award));

        $award->update($validated);

        return redirect()
            ->route('dashboard.awards.index')
            ->with('success', 'flash.awardUpdated');
    }

    public function destroy(Award $award): RedirectResponse
    {
        $award->delete();

        return redirect()
            ->route('dashboard.awards.index')
            ->with('success', 'flash.awardDeleted');
    }

    public function import(): Response
    {
        return Inertia::render('dashboard/awards/dashboard-awards-import', [
            'maxRows' => self::MAX_IMPORT_ROWS,
        ]);
    }

    /**
     * Persist a batch of rows parsed from a spreadsheet.
     *
     * Rows are matched on (person_id, award_id) and updated in place, so
     * re-importing a corrected sheet fixes existing awards instead of
     * duplicating them.
     */
    public function bulkImport(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'rows' => ['required', 'array', 'min:1', 'max:'.self::MAX_IMPORT_ROWS],
            'rows.*.person_id' => ['required', 'string', 'max:64'],
            'rows.*.award_id' => ['required', 'string', 'max:64'],
            'rows.*.full_name' => ['required', 'string', 'max:100'],
            'rows.*.father_name' => ['nullable', 'string', 'max:100'],
            'rows.*.awarded_at' => ['required', 'date_format:Y-m-d'],
        ]);

        $summary = $this->upsertRows($validated['rows']);

        return redirect()
            ->route('dashboard.awards.index')
            ->with('success', ['title' => 'flash.awardsImported', 'params' => $summary]);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array{created: int, updated: int, skipped: int}
     */
    private function upsertRows(array $rows): array
    {
        $records = [];
        $skipped = 0;

        foreach ($rows as $row) {
            $record = [
                'person_id' => trim((string) $row['person_id']),
                'award_id' => trim((string) $row['award_id']),
                'full_name' => trim((string) $row['full_name']),
                'father_name' => trim((string) ($row['father_name'] ?? '')) ?: null,
                'awarded_at' => $row['awarded_at'],
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $key = $record['person_id'].'|'.$record['award_id'];

            // A sheet may list the same pair twice; the later row wins so an
            // appended correction inside the same file still applies.
            if (isset($records[$key])) {
                $skipped++;
            }

            $records[$key] = $record;
        }

        $created = 0;
        $updated = 0;

        DB::transaction(function () use ($records, &$created, &$updated): void {
            foreach (array_chunk(array_values($records), 200) as $chunk) {
                $existing = Award::query()
                    ->where(function ($query) use ($chunk): void {
                        foreach ($chunk as $record) {
                            $query->orWhere(fn ($pair) => $pair
                                ->where('person_id', $record['person_id'])
                                ->where('award_id', $record['award_id']));
                        }
                    })
                    ->get(['person_id', 'award_id'])
                    ->map(fn (Award $award): string => $award->person_id.'|'.$award->award_id)
                    ->all();

                $existing = array_flip($existing);

                foreach ($chunk as $record) {
                    if (isset($existing[$record['person_id'].'|'.$record['award_id']])) {
                        $updated++;
                    } else {
                        $created++;
                    }
                }

                Award::query()->upsert(
                    $chunk,
                    ['person_id', 'award_id'],
                    ['full_name', 'father_name', 'awarded_at', 'updated_at'],
                );
            }
        });

        return ['created' => $created, 'updated' => $updated, 'skipped' => $skipped];
    }

    /**
     * Spreadsheet values frequently arrive padded with spaces; trim them before
     * validation so the unique-pair check compares the stored value.
     */
    private function normalizeCodes(Request $request): void
    {
        $request->merge(array_map(
            static fn (mixed $value): mixed => is_string($value) ? trim($value) : $value,
            $request->only(['person_id', 'award_id', 'full_name', 'father_name']),
        ) + $request->only(['awarded_at']));
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(Request $request, ?Award $award = null): array
    {
        $uniquePair = Rule::unique('awards')
            ->where(fn ($query) => $query
                ->where('person_id', (string) $request->input('person_id'))
                ->where('award_id', (string) $request->input('award_id')));

        if ($award !== null) {
            $uniquePair->ignore($award->getKey());
        }

        return [
            'person_id' => ['required', 'string', 'max:64'],
            'award_id' => ['required', 'string', 'max:64', $uniquePair],
            'full_name' => ['required', 'string', 'max:100'],
            'father_name' => ['nullable', 'string', 'max:100'],
            'awarded_at' => ['required', 'date'],
        ];
    }
}
