<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\EmailCampaignStatus;
use App\Enums\EmailDeliveryStatus;
use App\Enums\JobApplicationStatus;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Jobs\SendBulkAnnouncement;
use App\Models\Contact;
use App\Models\EmailCampaign;
use App\Models\Job;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Stevebauman\Purify\Facades\Purify;

class EmailCampaignController extends Controller
{
    /**
     * Allowed recipient sources.
     *
     * @var list<string>
     */
    public const SOURCES = ['users', 'contacts', 'users_contacts', 'custom', 'selected_applicants'];

    public function index(): Response
    {
        $campaigns = EmailCampaign::query()
            ->with('creator:id,name')
            ->latest()
            ->paginate(20);

        return Inertia::render('dashboard/email-campaigns/dashboard-email-campaigns-index', [
            'campaigns' => $campaigns,
        ]);
    }

    public function create(Request $request): Response
    {
        $requestedSource = in_array($request->query('recipient_source'), self::SOURCES, true)
            ? $request->query('recipient_source')
            : '';

        $requestedJobId = $request->integer('job_id') ?: null;

        return Inertia::render('dashboard/email-campaigns/dashboard-email-campaigns-create', [
            'counts' => [
                'users' => User::query()
                    ->where('status', UserStatus::Active->value)
                    ->whereKeyNot($request->user()->id)
                    ->count(),
                'contacts' => Contact::query()->distinct('email')->count('email'),
                'selected_applicants' => $this->selectedApplicantsQuery()->count(),
            ],
            'jobs' => Job::query()
                ->with('translations.language')
                ->orderByDesc('created_at')
                ->get(['id'])
                ->map(fn (Job $job): array => ['id' => $job->id, 'title' => $job->title])
                ->values(),
            'initialSource' => $requestedSource,
            'initialJobFilter' => $requestedJobId,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:100000'],
            'recipient_source' => ['required', 'in:'.implode(',', self::SOURCES)],
            'custom_emails' => ['nullable', 'required_if:recipient_source,custom', 'string', 'max:100000'],
            'job_filter' => ['nullable', 'integer', Rule::exists('job_postings', 'id')],
        ]);

        // The body comes from the rich-text editor; strip anything unsafe before
        // it is stored, because the mail view renders it as raw HTML.
        $validated['body'] = Purify::clean($validated['body']);

        $recipients = $this->resolveRecipients($validated['recipient_source'], $validated['custom_emails'] ?? null, $request->user()->id, $validated['job_filter'] ?? null);

        if ($recipients->isEmpty()) {
            return back()->with('error', 'flash.noValidRecipients');
        }

        $campaign = DB::transaction(function () use ($request, $validated, $recipients): EmailCampaign {
            $campaign = EmailCampaign::query()->create([
                'user_id' => $request->user()->id,
                'subject' => $validated['subject'],
                'body' => $validated['body'],
                'recipient_source' => $validated['recipient_source'],
                'total_count' => $recipients->count(),
                'status' => EmailCampaignStatus::Queued,
            ]);

            $campaign->recipients()->createMany(
                $recipients->map(fn (array $recipient): array => $recipient + [
                    'status' => EmailDeliveryStatus::Pending,
                ])->all()
            );

            return $campaign;
        });

        $campaign->recipients()
            ->where('status', EmailDeliveryStatus::Pending->value)
            ->orderBy('id')
            ->pluck('id')
            ->each(fn (int $id) => SendBulkAnnouncement::dispatch($id));

        return redirect()
            ->route('dashboard.email-campaigns.show', $campaign)
            ->with('success', ['title' => 'flash.emailCampaignQueued', 'params' => ['count' => $campaign->total_count]]);
    }

    public function show(EmailCampaign $emailCampaign): Response
    {
        $emailCampaign->load('creator:id,name');

        return Inertia::render('dashboard/email-campaigns/dashboard-email-campaigns-show', [
            'campaign' => $emailCampaign,
            'bodyHtml' => $emailCampaign->bodyHtml(),
            'recipients' => $emailCampaign->recipients()
                ->orderByRaw("case when status = 'failed' then 0 else 1 end")
                ->orderBy('id')
                ->paginate(50)
                ->withQueryString(),
        ]);
    }

    public function retry(Request $request, EmailCampaign $emailCampaign): RedirectResponse
    {
        $failed = $emailCampaign->recipients()
            ->where('status', EmailDeliveryStatus::Failed)
            ->get();

        if ($failed->isEmpty()) {
            return back()->with('info', 'flash.noFailedRecipients');
        }

        DB::transaction(function () use ($emailCampaign, $failed): void {
            $failed->each(fn ($recipient) => $recipient->update([
                'status' => EmailDeliveryStatus::Pending,
                'error' => null,
            ]));

            $emailCampaign->update([
                'status' => EmailCampaignStatus::Queued,
                'failed_count' => max(0, $emailCampaign->failed_count - $failed->count()),
            ]);
        });

        $failed->each(fn ($recipient) => SendBulkAnnouncement::dispatch($recipient->id));

        return back()->with('success', ['title' => 'flash.reSentFailed', 'params' => ['count' => $failed->count()]]);
    }

    /**
     * Build the deduplicated recipient list for the chosen source.
     *
     * @return Collection<int, array{name: string|null, email: string}>
     */
    private function resolveRecipients(string $source, ?string $customEmails, ?int $excludeUserId = null, ?int $jobFilter = null): Collection
    {
        $recipients = collect();

        if (in_array($source, ['users', 'users_contacts'], true)) {
            $recipients = $recipients->concat(
                User::query()
                    ->where('status', UserStatus::Active->value)
                    ->when($excludeUserId, fn ($query) => $query->whereKeyNot($excludeUserId))
                    ->get(['name', 'email'])
                    ->map(fn (User $user): array => ['name' => $user->name, 'email' => $user->email])
            );
        }

        if (in_array($source, ['contacts', 'users_contacts'], true)) {
            $recipients = $recipients->concat(
                Contact::query()
                    ->get(['name', 'email'])
                    ->map(fn (Contact $contact): array => ['name' => $contact->name, 'email' => $contact->email])
            );
        }

        if ($source === 'selected_applicants') {
            $recipients = $recipients->concat(
                $this->selectedApplicantsQuery($jobFilter)
                    ->get(['first_name', 'last_name', 'email'])
                    ->map(fn (JobApplication $application): array => [
                        'name' => trim("{$application->first_name} {$application->last_name}"),
                        'email' => $application->email,
                    ])
            );
        }

        if ($source === 'custom') {
            foreach (preg_split('/[\r\n,;]+/', (string) $customEmails) ?: [] as $email) {
                $email = strtolower(trim($email));

                if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) !== false) {
                    $recipients->push(['name' => null, 'email' => $email]);
                }
            }
        }

        return $recipients
            ->unique(fn (array $recipient): string => strtolower($recipient['email']))
            ->filter(fn (array $recipient): bool => filter_var($recipient['email'], FILTER_VALIDATE_EMAIL) !== false)
            ->values();
    }

    /**
     * Applicants marked as selected, optionally narrowed to one job posting.
     */
    private function selectedApplicantsQuery(?int $jobFilter = null): Builder
    {
        return JobApplication::query()
            ->where('status', JobApplicationStatus::Selected->value)
            ->when($jobFilter, fn ($query) => $query->where('job_id', $jobFilter));
    }
}
