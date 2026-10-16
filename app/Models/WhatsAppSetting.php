<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Single-row, DB-backed store for the WhatsApp Business (Meta Cloud API)
 * credentials an admin supplies from the dashboard. The access token is encrypted
 * at rest and never serialized, so it can only be read back through the model in
 * PHP — it is deliberately NOT part of the public SiteSetting share payload.
 *
 * When a row here is absent or incomplete the WhatsAppService falls back to the
 * `services.whatsapp` .env values; the feature is only "configured" when either
 * source yields a token plus a phone number id.
 */
class WhatsAppSetting extends Model
{
    // Laravel would otherwise derive "whats_app_settings" from the class name.
    protected $table = 'whatsapp_settings';

    protected $fillable = [
        'access_token',
        'phone_number_id',
        'business_account_id',
        'graph_version',
        'is_active',
    ];

    /**
     * The token is a secret: keep it out of array/JSON serialization and any
     * accidental debug output.
     *
     * @var list<string>
     */
    protected $hidden = [
        'access_token',
    ];

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'is_active' => 'boolean',
        ];
    }

    /**
     * The persisted row, or an unsaved instance seeded with the graph version
     * default. Never writes on read.
     */
    public static function current(): static
    {
        return static::query()->first() ?? new static(['graph_version' => 'v23.0', 'is_active' => true]);
    }

    /**
     * The persisted row, creating it on demand (used by the update flow).
     */
    public static function resolved(): static
    {
        return static::query()->first() ?? static::query()->create([]);
    }

    /**
     * Whether this DB row alone carries usable credentials. The token column is
     * encrypted, so existence is enough here — the service reads the decrypted
     * value when actually sending.
     */
    public function hasCredentials(): bool
    {
        return $this->is_active
            && filled($this->access_token)
            && filled($this->phone_number_id);
    }

    /**
     * Safe, non-secret shape for the settings screen: reveals nothing but masked
     * hints so the admin knows what is currently stored.
     *
     * @return array<string, mixed>
     */
    public function toDashboard(): array
    {
        return [
            'phone_number_id' => $this->phone_number_id,
            'business_account_id' => $this->business_account_id,
            'graph_version' => $this->graph_version,
            'is_active' => (bool) $this->is_active,
            'has_token' => filled($this->access_token),
            // Never return the token; the frontend only needs to know one is saved.
        ];
    }
}
