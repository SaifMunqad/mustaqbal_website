<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\WhatsAppCampaignStatus;
use App\Enums\WhatsAppDeliveryStatus;
use App\Http\Controllers\Controller;
use App\Jobs\SendWhatsAppMessage;
use App\Models\Contact;
use App\Models\WhatsAppCampaign;
use App\Services\WhatsAppService;
use App\Support\WhatsApp\WhatsAppMarkup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Stevebauman\Purify\Facades\Purify;

class WhatsAppCampaignController extends Controller
{
    /**
     * Allowed recipient sources. Unlike bulk email there is no "users" source:
     * the User model carries no phone number, so recipients come from contact
     * records or a manually supplied / imported list of numbers.
     *
     * @var list<string>
     */
    public const SOURCES = ['contacts', 'custom'];

    public function index(WhatsAppService $whatsapp): Response
    {
        $campaigns = WhatsAppCampaign::query()
            ->with('creator:id,name')
            ->latest()
            ->paginate(20);

        return Inertia::render('dashboard/whatsapp-campaigns/dashboard-whatsapp-campaigns-index', [
            'campaigns' => $campaigns,
            'configured' => $whatsapp->isConfigured(),
        ]);
    }

    public function create(Request $request, WhatsAppService $whatsapp): Response
    {
        return Inertia::render('dashboard/whatsapp-campaigns/dashboard-whatsapp-campaigns-create', [
            'configured' => $whatsapp->isConfigured(),
            'counts' => [
                'contacts' => Contact::query()->whereNotNull('phone')->distinct('phone')->count('phone'),
            ],
        ]);
    }

    public function store(Request $request, WhatsAppService $whatsapp): RedirectResponse
    {
        if (! $whatsapp->isConfigured()) {
            return redirect()
                ->route('dashboard.whatsapp-settings.edit')
                ->with('error', 'flash.whatsappNotConfigured');
        }

        $validated = $request->validate([
            'recipient_source' => ['required', 'in:'.implode(',', self::SOURCES)],
            'custom_numbers' => ['nullable', 'required_if:recipient_source,custom', 'string', 'max:100000'],
            'mode' => ['required', 'in:text,template'],
            'message' => ['nullable', 'required_if:mode,text', 'string', 'max:100000'],
            'template_name' => ['nullable', 'required_if:mode,template', 'string', 'max:255'],
            'template_language' => ['nullable', 'required_if:mode,template', 'string', 'max:16'],
            'template_variables' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($validated['mode'] === 'text') {
            $validated['message'] = $this->prepareMessage((string) ($validated['message'] ?? ''));
        }

        $recipients = $this->resolveRecipients(
            $validated['recipient_source'],
            $validated['custom_numbers'] ?? null,
        );

        if ($recipients->isEmpty()) {
            return back()->with('error', 'flash.noValidNumbers');
        }

        $campaign = DB::transaction(function () use ($request, $validated, $recipients): WhatsAppCampaign {
            $campaign = WhatsAppCampaign::query()->create([
                'user_id' => $request->user()->id,
                'mode' => $validated['mode'],
                'message' => $validated['mode'] === 'text' ? $validated['message'] : null,
                'template_name' => $validated['mode'] === 'template' ? $validated['template_name'] : null,
                'template_language' => $validated['mode'] === 'template' ? $validated['template_language'] : null,
                'template_variables' => $validated['mode'] === 'template'
                    ? $this->parseLines($validated['template_variables'] ?? null)
                    : null,
                'recipient_source' => $validated['recipient_source'],
                'total_count' => $recipients->count(),
                'status' => WhatsAppCampaignStatus::Queued,
            ]);

            $campaign->recipients()->createMany(
                $recipients->map(fn (array $recipient): array => $recipient + [
                    'status' => WhatsAppDeliveryStatus::Pending,
                ])->all()
            );

            return $campaign;
        });

        $campaign->recipients()
            ->where('status', WhatsAppDeliveryStatus::Pending->value)
            ->orderBy('id')
            ->pluck('id')
            ->each(fn (int $id) => SendWhatsAppMessage::dispatch($id));

        return redirect()
            ->route('dashboard.whatsapp-campaigns.show', $campaign)
            ->with('success', ['title' => 'flash.whatsappCampaignQueued', 'params' => ['count' => $campaign->total_count]]);
    }

    public function show(WhatsAppCampaign $whatsappCampaign): Response
    {
        $whatsappCampaign->load('creator:id,name');

        return Inertia::render('dashboard/whatsapp-campaigns/dashboard-whatsapp-campaigns-show', [
            'campaign' => $whatsappCampaign,
            // Exactly the text WhatsApp will receive (HTML flattened to markup).
            'messageText' => WhatsAppMarkup::fromHtml($whatsappCampaign->message),
            'recipients' => $whatsappCampaign->recipients()
                ->orderByRaw("case when status = 'failed' then 0 else 1 end")
                ->orderBy('id')
                ->paginate(50)
                ->withQueryString(),
        ]);
    }

    public function retry(WhatsAppCampaign $whatsappCampaign): RedirectResponse
    {
        $failed = $whatsappCampaign->recipients()
            ->where('status', WhatsAppDeliveryStatus::Failed)
            ->get();

        if ($failed->isEmpty()) {
            return back()->with('info', 'flash.noFailedRecipients');
        }

        DB::transaction(function () use ($whatsappCampaign, $failed): void {
            $failed->each(fn ($recipient) => $recipient->update([
                'status' => WhatsAppDeliveryStatus::Pending,
                'error' => null,
            ]));

            $whatsappCampaign->update([
                'status' => WhatsAppCampaignStatus::Queued,
                'failed_count' => max(0, $whatsappCampaign->failed_count - $failed->count()),
            ]);
        });

        $failed->each(fn ($recipient) => SendWhatsAppMessage::dispatch($recipient->id));

        return back()->with('success', ['title' => 'flash.reSentFailed', 'params' => ['count' => $failed->count()]]);
    }

    /**
     * Sanitize the editor HTML and make sure its WhatsApp rendering fits in a
     * single Cloud API text message (4096 characters).
     */
    private function prepareMessage(string $html): string
    {
        $clean = Purify::clean($html);
        $length = mb_strlen(WhatsAppMarkup::fromHtml($clean));

        if ($length === 0) {
            throw ValidationException::withMessages([
                'message' => __('The message is empty once rendered as WhatsApp text. Add some text next to any images.'),
            ]);
        }

        if ($length > 4096) {
            throw ValidationException::withMessages([
                'message' => __('The message is too long for WhatsApp: :count characters after formatting (maximum 4096).', ['count' => $length]),
            ]);
        }

        return $clean;
    }

    /**
     * Build the deduplicated recipient list of normalised phone numbers.
     *
     * @return Collection<int, array{name: string|null, phone: string}>
     */
    private function resolveRecipients(string $source, ?string $customNumbers): Collection
    {
        $recipients = collect();

        if ($source === 'contacts') {
            Contact::query()
                ->whereNotNull('phone')
                ->get(['name', 'phone'])
                ->each(function (Contact $contact) use ($recipients): void {
                    $phone = $this->normalizePhone($contact->phone);

                    if ($phone !== null) {
                        $recipients->push(['name' => $contact->name, 'phone' => $phone]);
                    }
                });
        }

        if ($source === 'custom') {
            foreach ($this->parseLines($customNumbers) as $raw) {
                $phone = $this->normalizePhone($raw);

                if ($phone !== null) {
                    $recipients->push(['name' => null, 'phone' => $phone]);
                }
            }
        }

        return $recipients
            ->unique(fn (array $recipient): string => $recipient['phone'])
            ->values();
    }

    /**
     * Normalise a phone number to E.164-ish digits only (WhatsApp needs the full
     * international number without separators). Returns null when it can't plausibly
     * be a valid number.
     */
    private function normalizePhone(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        if ($trimmed === '') {
            return null;
        }

        // Drop a leading "+" and any non-digit characters.
        $digits = preg_replace('/\D+/', '', $trimmed) ?? '';

        return (strlen($digits) >= 7 && strlen($digits) <= 15) ? $digits : null;
    }

    /**
     * Split a textarea/list into trimmed, non-empty lines.
     *
     * @return list<string>
     */
    private function parseLines(?string $value): array
    {
        if (blank($value)) {
            return [];
        }

        return array_values(array_filter(
            array_map('trim', preg_split('/[\r\n,;]+/', $value) ?: []),
            static fn (string $line): bool => $line !== '',
        ));
    }
}
