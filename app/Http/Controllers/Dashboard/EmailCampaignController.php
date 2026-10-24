<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\EmailCampaignStatus;
use App\Enums\EmailDeliveryStatus;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Jobs\SendBulkAnnouncement;
use App\Models\Contact;
use App\Models\EmailCampaign;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EmailCampaignController extends Controller
{
    /**
     * Allowed recipient sources.
     *
     * @var list<string>
     */
    public const SOURCES = ['users', 'contacts', 'users_contacts', 'custom'];

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
        return Inertia::render('dashboard/email-campaigns/dashboard-email-campaigns-create', [
            'counts' => [
                'users' => User::query()
                    ->where('status', UserStatus::Active->value)
                    ->whereKeyNot($request->user()->id)
                    ->count(),
                'contacts' => Contact::query()->distinct('email')->count('email'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:20000'],
            'recipient_source' => ['required', 'in:'.implode(',', self::SOURCES)],
            'custom_emails' => ['nullable', 'required_if:recipient_source,custom', 'string', 'max:100000'],
        ]);

        $recipients = $this->resolveRecipients($validated['recipient_source'], $validated['custom_emails'] ?? null, $request->user()->id);

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
    private function resolveRecipients(string $source, ?string $customEmails, ?int $excludeUserId = null): Collection
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
}
