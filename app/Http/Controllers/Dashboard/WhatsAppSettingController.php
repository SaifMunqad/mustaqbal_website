<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\UpdateWhatsAppSettingRequest;
use App\Models\WhatsAppSetting;
use App\Services\WhatsAppService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin-facing configuration for the WhatsApp Business Cloud API. Credentials are
 * stored encrypted in the database (see {@see WhatsAppSetting}); the token is
 * write-only from the UI — saving a blank field leaves the existing token intact.
 */
class WhatsAppSettingController extends Controller
{
    public function edit(WhatsAppService $whatsapp): Response
    {
        $setting = WhatsAppSetting::current();

        return Inertia::render('dashboard/whatsapp-settings/dashboard-whatsapp-settings-edit', [
            'setting' => $setting->toDashboard(),
            'configured' => $whatsapp->isConfigured(),
            'source' => $whatsapp->source(),
        ]);
    }

    public function update(UpdateWhatsAppSettingRequest $request, WhatsAppService $whatsapp): RedirectResponse
    {
        $validated = $request->validated();

        $setting = WhatsAppSetting::resolved();

        // A blank token means "keep the currently stored one" — the field is never
        // pre-filled, so an edit that touches other fields must not wipe the secret.
        if (filled($validated['access_token'] ?? null)) {
            $setting->access_token = $validated['access_token'];
        }

        $setting->fill([
            'phone_number_id' => $validated['phone_number_id'] ?? null,
            'business_account_id' => $validated['business_account_id'] ?? null,
            'graph_version' => $validated['graph_version'] ?: 'v23.0',
            'is_active' => $request->boolean('is_active', true),
        ])->save();

        $message = $whatsapp->isConfigured()
            ? 'flash.whatsappSaved'
            : 'flash.whatsappSavedIncomplete';

        return back()->with('success', $message);
    }

    public function test(WhatsAppService $whatsapp): RedirectResponse
    {
        $result = $whatsapp->testConnection();

        if ($result['ok']) {
            $number = $result['display_phone_number'] ?? '';

            return $number
                ? back()->with('success', [
                    'title' => 'flash.whatsappConnectionPassed',
                    'params' => ['number' => $number],
                ])
                : back()->with('success', 'flash.whatsappConnectionPassedNoNumber');
        }

        return back()->with('error', [
            'title' => 'flash.whatsappConnectionFailed',
            'params' => ['message' => $result['message']],
        ]);
    }
}
