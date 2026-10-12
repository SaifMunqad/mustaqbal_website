import DashboardPage from '@/components/dashboard/dashboard-page';
import GoogleLocationPicker, { PickedLocation } from '@/components/google-location-picker';
import { TextAreaField, TextField } from '@/components/form-fields';
import { useFormToast } from '@/components/use-form-toast';
import { Form, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

function buildEmbedUrl(lat: number, lng: number, zoom: number): string {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

interface SiteSettingRecord {
    id?: number;
    brand_name: string;
    brand_short_name: string;
    tagline?: string | null;
    logo_url?: string | null;
    home_title?: string | null;
    home_subtitle?: string | null;
    home_cta_primary?: string | null;
    home_cta_secondary?: string | null;
    home_hero_image?: string | null;
    contact_email?: string | null;
    contact_phone_primary?: string | null;
    contact_phone_secondary?: string | null;
    address?: string | null;
    map_latitude?: number | null;
    map_longitude?: number | null;
    map_zoom?: number | null;
    map_embed_url?: string | null;
    social_facebook?: string | null;
    social_instagram?: string | null;
    social_twitter?: string | null;
    social_youtube?: string | null;
    social_whatsapp?: string | null;
    footer_text?: string | null;
}

function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <fieldset className="grid gap-3 rounded-xl border p-4">
            <legend className="px-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {title}
            </legend>
            {children}
        </fieldset>
    );
}

export default function DashboardSiteSettingsEdit() {
    const { settings, mapsKey } = usePage<{
        settings: SiteSettingRecord;
        mapsKey?: string | null;
    }>().props;
    const { onError } = useFormToast('Site settings updated successfully.');

    // Map/location state is controlled so the picker, the derived embed URL and
    // the address box stay in sync before submit.
    const [address, setAddress] = useState(settings.address ?? '');
    const [latitude, setLatitude] = useState<number | null>(settings.map_latitude ?? null);
    const [longitude, setLongitude] = useState<number | null>(settings.map_longitude ?? null);
    const [zoom, setZoom] = useState<number>(settings.map_zoom ?? 15);
    const [embedUrl, setEmbedUrl] = useState(settings.map_embed_url ?? '');

    const handlePick = (location: PickedLocation) => {
        setLatitude(location.latitude);
        setLongitude(location.longitude);
        setZoom(location.zoom);
        setEmbedUrl(buildEmbedUrl(location.latitude, location.longitude, location.zoom));

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
                            <TextField
                                label="Logo URL"
                                name="logo_url"
                                error={errors.logo_url}
                                placeholder="https://..."
                                defaultValue={settings.logo_url ?? ''}
                            />
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

                            {/* Persisted coordinates + derived embed URL. */}
                            <input type="hidden" name="map_latitude" value={latitude ?? ''} />
                            <input type="hidden" name="map_longitude" value={longitude ?? ''} />
                            <input type="hidden" name="map_zoom" value={zoom} />
                            <input type="hidden" name="map_embed_url" value={embedUrl} />

                            {!mapsKey ? (
                                <TextField
                                    label="Map embed URL"
                                    name="map_embed_url"
                                    error={errors.map_embed_url}
                                    placeholder="https://maps.google.com/..."
                                    defaultValue={settings.map_embed_url ?? ''}
                                    hint="No Google Maps key configured: paste an embed URL to show a map on the public page."
                                />
                            ) : null}
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
