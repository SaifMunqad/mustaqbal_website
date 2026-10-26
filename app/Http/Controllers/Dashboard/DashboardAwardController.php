<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\BulkImportAwardsRequest;
use App\Http\Requests\Dashboard\StoreAwardRequest;
use App\Http\Requests\Dashboard\UpdateAwardRequest;
use App\Models\Award;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function store(StoreAwardRequest $request): RedirectResponse
    {
        $validated = $request->validated();

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

    public function update(UpdateAwardRequest $request, Award $award): RedirectResponse
    {
        $validated = $request->validated();

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
    public function bulkImport(BulkImportAwardsRequest $request): RedirectResponse
    {
        $validated = $request->validated();

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
}
