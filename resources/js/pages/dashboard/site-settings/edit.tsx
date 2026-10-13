import DashboardPage from '@/components/dashboard/dashboard-page';
import { TextAreaField, TextField } from '@/components/form-fields';
import { ImageUploadField } from '@/components/form/image-upload-field';
import GoogleLocationPicker, {
    PickedLocation,
} from '@/components/google-location-picker';
import { useFormToast } from '@/components/use-form-toast';
import HomeStatsEditor from '@/components/dashboard/site-settings/home-stats-editor';
import HomeFeaturesEditor from '@/components/dashboard/site-settings/home-features-editor';
import {
    buildEmbedUrl,
    Group,
    type SiteSettingRecord,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { Form, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function DashboardSiteSettingsEdit() {
    const { settings, mapsKey } = usePage<{
        settings: SiteSettingRecord;
        mapsKey?: string | null;
    }>().props;
    const { onError } = useFormToast('Site settings updated successfully.');

    // Brand assets are uploaded through the shared /dashboard/upload endpoint,
    // which returns a public URL kept in controlled state so the live preview
    // and the submitted hidden input stay in sync.
    const [logoUrl, setLogoUrl] = useState(settings.logo_url ?? '');
    const [faviconUrl, setFaviconUrl] = useState(settings.favicon_url ?? '');

    // Map/location state is controlled so the picker, the derived embed URL and
    // the address box stay in sync before submit.
    const [address, setAddress] = useState(settings.address ?? '');
    const [latitude, setLatitude] = useState<number | null>(
        settings.map_latitude ?? null,
    );
    const [longitude, setLongitude] = useState<number | null>(
        settings.map_longitude ?? null,
    );
    const [zoom, setZoom] = useState<number>(settings.map_zoom ?? 15);
    const [embedUrl, setEmbedUrl] = useState(settings.map_embed_url ?? '');

    // Home page quick-stats and "why choose us" features are repeatable lists
    // stored as JSON on the single site_settings row. Their editors are separate
    // components that report changes back through these setters.
    const [stats, setStats] = useState(settings.home_stats ?? []);
    const [features, setFeatures] = useState(settings.home_features ?? []);

    const handlePick = (location: PickedLocation) => {
        setLatitude(location.latitude);
        setLongitude(location.longitude);
        setZoom(location.zoom);
        setEmbedUrl(
            buildEmbedUrl(location.latitude, location.longitude, location.zoom),
        );

        if (location.address) {
            setAddress(location.address);
        }
    };

    return (
        <DashboardPage titleKey="dashboard.settings.editTitle">
            <Form
                action="/dashboard/site-settings"
                method="put"
                onError={onError}
                className="grid gap-4"
            >
                {({ errors, processing }) => (
                    <>
                        <Group title="Branding">
                            <TextField
                                label="Brand name"
                                name="brand_name"
                                required
                                error={errors.brand_name}
                                defaultValue={settings.brand_name ?? ''}
                            />
                            <TextField
                                label="Short name"
                                name="brand_short_name"
                                required
                                error={errors.brand_short_name}
                                defaultValue={settings.brand_short_name ?? ''}
                            />
                            <TextField
                                label="Tagline"
                                name="tagline"
                                error={errors.tagline}
                                defaultValue={settings.tagline ?? ''}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <ImageUploadField
                                    label="Logo (PNG)"
                                    name="logo_url"
                                    value={logoUrl}
                                    onChange={setLogoUrl}
                                    error={errors.logo_url}
                                    hint="Shown in the public nav bar, footer and dashboard sidebar. PNG recommended."
                                />
                                <ImageUploadField
                                    label="Favicon (.ico)"
                                    name="favicon_url"
                                    value={faviconUrl}
                                    onChange={setFaviconUrl}
                                    error={errors.favicon_url}
                                    accept=".ico,image/x-icon,image/vnd.microsoft.icon"
                                    previewClassName="h-16 w-16 object-contain"
                                    hint="Browser tab icon. Upload an .ico file; falls back to the default icon when empty."
                                />
                            </div>
                        </Group>

                        <Group title="Home page">
                            <TextField
                                label="Home title"
                                name="home_title"
                                error={errors.home_title}
                                defaultValue={settings.home_title ?? ''}
                            />
                            <TextAreaField
                                label="Home subtitle"
                                name="home_subtitle"
                                error={errors.home_subtitle}
                                className="h-24"
                                defaultValue={settings.home_subtitle ?? ''}
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <TextField
                                    label="Primary CTA"
                                    name="home_cta_primary"
                                    error={errors.home_cta_primary}
                                    defaultValue={settings.home_cta_primary ?? ''}
                                />
                                <TextField
                                    label="Secondary CTA"
                                    name="home_cta_secondary"
                                    error={errors.home_cta_secondary}
                                    defaultValue={settings.home_cta_secondary ?? ''}
                                />
                            </div>
                            <TextField
                                label="Hero image URL"
                                name="home_hero_image"
                                error={errors.home_hero_image}
                                placeholder="https://..."
                                defaultValue={settings.home_hero_image ?? ''}
                            />

                            <HomeStatsEditor stats={stats} onChange={setStats} />

                            <HomeFeaturesEditor features={features} onChange={setFeatures} />
                        </Group>

                        <Group title="Contact details">
                            <TextField
                                label="Email"
                                name="contact_email"
                                type="email"
                                error={errors.contact_email}
                                defaultValue={settings.contact_email ?? ''}
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <TextField
                                    label="Primary phone"
                                    name="contact_phone_primary"
                                    error={errors.contact_phone_primary}
                                    defaultValue={settings.contact_phone_primary ?? ''}
                                />
                                <TextField
                                    label="Secondary phone"
                                    name="contact_phone_secondary"
                                    error={errors.contact_phone_secondary}
                                    defaultValue={settings.contact_phone_secondary ?? ''}
                                />
                            </div>
                            <TextField
                                label="Address"
                                name="address"
                                error={errors.address}
                                value={address}
                                onChange={(event) => setAddress(event.target.value)}
                            />

                            <GoogleLocationPicker
                                apiKey={mapsKey ?? ''}
                                latitude={latitude}
                                longitude={longitude}
                                zoom={zoom}
                                onChange={handlePick}
                            />

                            {/* Persisted coordinates. */}
                            <input type="hidden" name="map_latitude" value={latitude ?? ''} />
                            <input type="hidden" name="map_longitude" value={longitude ?? ''} />
                            <input type="hidden" name="map_zoom" value={zoom} />

                            {mapsKey ? (
                                // With a key the embed URL is derived from the pin.
                                <input type="hidden" name="map_embed_url" value={embedUrl} />
                            ) : (
                                // Without a key the admin pastes it directly.
                                <TextField
                                    label="Map embed URL"
                                    name="map_embed_url"
                                    error={errors.map_embed_url}
                                    placeholder="https://maps.google.com/..."
                                    defaultValue={settings.map_embed_url ?? ''}
                                    hint="No Google Maps key configured: paste an embed URL to show a map on the public page."
                                />
                            )}
                        </Group>

                        <Group title="Social links">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <TextField
                                    label="Facebook"
                                    name="social_facebook"
                                    error={errors.social_facebook}
                                    defaultValue={settings.social_facebook ?? ''}
                                />
                                <TextField
                                    label="Instagram"
                                    name="social_instagram"
                                    error={errors.social_instagram}
                                    defaultValue={settings.social_instagram ?? ''}
                                />
                                <TextField
                                    label="Twitter / X"
                                    name="social_twitter"
                                    error={errors.social_twitter}
                                    defaultValue={settings.social_twitter ?? ''}
                                />
                                <TextField
                                    label="YouTube"
                                    name="social_youtube"
                                    error={errors.social_youtube}
                                    defaultValue={settings.social_youtube ?? ''}
                                />
                            </div>
                            <TextField
                                label="WhatsApp (number)"
                                name="social_whatsapp"
                                error={errors.social_whatsapp}
                                defaultValue={settings.social_whatsapp ?? ''}
                            />
                        </Group>

                        <Group title="Footer">
                            <TextField
                                label="Footer text"
                                name="footer_text"
                                error={errors.footer_text}
                                defaultValue={settings.footer_text ?? ''}
                            />
                        </Group>

                        <button
                            className="w-fit rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                            type="submit"
                            disabled={processing}
                        >
                            Save settings
                        </button>
                    </>
                )}
            </Form>
        </DashboardPage>
    );
}
