<?php

namespace App\Services;

use App\Models\WhatsAppCampaign;
use App\Models\WhatsAppSetting;
use App\Support\WhatsApp\WhatsAppMarkup;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Thin wrapper around the WhatsApp Business (Meta) Cloud API used by the bulk
 * campaign feature. Credentials are resolved from the encrypted DB row first and
 * fall back to the `services.whatsapp` .env values, so the feature works with
 * either an admin-entered token or a server-configured one.
 *
 * Two message shapes are supported:
 *   - free-form "text" (only valid inside a 24h user-initiated window), and
 *   - approved "template" messages (required for cold bulk outreach).
 */
class WhatsAppService
{
    private const BASE_URL = 'https://graph.facebook.com';

    /**
     * Whether the feature has enough configuration (token + phone number id) to
     * actually send. Used to gate the campaign UI behind a "not configured" state.
     */
    public function isConfigured(): bool
    {
        return $this->credentials() !== null;
    }

    /**
     * Where the active credentials come from, for the settings screen badge.
     */
    public function source(): string
    {
        $setting = WhatsAppSetting::current();

        if ($setting->hasCredentials()) {
            return 'database';
        }

        if (filled(config('services.whatsapp.token')) && filled(config('services.whatsapp.phone_number_id'))) {
            return 'env';
        }

        return 'none';
    }

    /**
     * @return array{token: string, phone_number_id: string, version: string}|null
     */
    private function credentials(): ?array
    {
        $setting = WhatsAppSetting::current();

        if ($setting->hasCredentials()) {
            return [
                'token' => (string) $setting->access_token,
                'phone_number_id' => (string) $setting->phone_number_id,
                'version' => $setting->graph_version ?: config('services.whatsapp.version', 'v23.0'),
            ];
        }

        $token = config('services.whatsapp.token');
        $phoneNumberId = config('services.whatsapp.phone_number_id');

        if (filled($token) && filled($phoneNumberId)) {
            return [
                'token' => (string) $token,
                'phone_number_id' => (string) $phoneNumberId,
                'version' => (string) config('services.whatsapp.version', 'v23.0'),
            ];
        }

        return null;
    }

    /**
     * Send a free-form text message. Returns Meta's message id (wamid...).
     *
     * @throws RuntimeException when the request fails or the API returns an error.
     */
    public function sendText(string $to, string $body): ?string
    {
        return $this->send([
            'messaging_product' => 'whatsapp',
            'to' => $to,
            'type' => 'text',
            'text' => [
                'preview_url' => false,
                'body' => $body,
            ],
        ]);
    }

    /**
     * Send an approved template message. Positional variables fill the template's
     * body placeholders ({{1}}, {{2}, ...). Returns Meta's message id.
     *
     * @param  list<string>  $variables
     *
     * @throws RuntimeException
     */
    public function sendTemplate(string $to, string $name, string $language, array $variables = []): ?string
    {
        $template = [
            'name' => $name,
            'language' => ['code' => $language],
        ];

        if ($variables !== []) {
            $template['components'] = [[
                'type' => 'body',
                'parameters' => array_map(
                    static fn (string $value): array => ['type' => 'text', 'text' => $value],
                    array_values($variables)
                ),
            ]];
        }

        return $this->send([
            'messaging_product' => 'whatsapp',
            'to' => $to,
            'type' => 'template',
            'template' => $template,
        ]);
    }

    /**
     * Dispatch whichever payload the given campaign describes. Keeps the job layer
     * free of the text/template branching.
     *
     * @throws RuntimeException
     */
    public function sendForCampaign(WhatsAppCampaign $campaign, string $to): ?string
    {
        if ($campaign->isTemplate()) {
            return $this->sendTemplate(
                $to,
                (string) $campaign->template_name,
                (string) ($campaign->template_language ?: 'en'),
                array_map('strval', $campaign->template_variables ?? []),
            );
        }

        return $this->sendText($to, WhatsAppMarkup::fromHtml($campaign->message));
    }

    /**
     * Verify the stored credentials by reading the phone number's metadata. Never
     * throws — returns a normalised, human-readable result for the settings screen.
     *
     * @return array{ok: bool, message: string, display_phone_number?: string|null}
     */
    public function testConnection(): array
    {
        $credentials = $this->credentials();

        if ($credentials === null) {
            return ['ok' => false, 'message' => 'No WhatsApp credentials are configured yet.'];
        }

        try {
            $response = Http::withToken($credentials['token'])
                ->timeout(15)
                ->get($this->endpoint($credentials, $credentials['phone_number_id']), [
                    'fields' => 'id,display_phone_number,verified_name',
                ]);

            if ($response->failed()) {
                return ['ok' => false, 'message' => $this->describeError($response)];
            }

            return [
                'ok' => true,
                'message' => 'Connection successful.',
                'display_phone_number' => $response->json('display_phone_number'),
            ];
        } catch (RuntimeException $exception) {
            return ['ok' => false, 'message' => $exception->getMessage()];
        }
    }

    /**
     * @param  array{token: string, phone_number_id: string, version: string}  $credentials
     */
    private function endpoint(array $credentials, ?string $resource = null): string
    {
        $resource ??= $credentials['phone_number_id'];

        return self::BASE_URL.'/'.$credentials['version'].'/'.$resource.'/messages';
    }

    /**
     * Perform the authenticated POST and surface a single message id on success.
     *
     * @param  array<string, mixed>  $payload
     *
     * @throws RuntimeException
     */
    private function send(array $payload): ?string
    {
        $credentials = $this->credentials();

        if ($credentials === null) {
            throw new RuntimeException('WhatsApp is not configured.');
        }

        $response = Http::asJson()
            ->withToken($credentials['token'])
            ->timeout(20)
            ->post($this->endpoint($credentials), $payload);

        if ($response->failed()) {
            throw new RuntimeException($this->describeError($response));
        }

        return $response->json('messages.0.id');
    }

    /**
     * Turn a Meta error body into a concise, non-empty message suitable for the
     * per-recipient error column.
     */
    private function describeError(Response $response): string
    {
        $error = $response->json('error');

        if (is_array($error)) {
            $message = $error['message'] ?? 'WhatsApp API request failed.';
            $code = isset($error['code']) ? ' (code '.$error['code'].')' : '';

            return $message.$code;
        }

        return 'WhatsApp API request failed with HTTP '.$response->status().'.';
    }
}
