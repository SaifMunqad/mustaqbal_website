import DashboardPage from '@/components/dashboard/dashboard-page';
import { TextAreaField, TextField } from '@/components/form-fields';
import { ImageUploadField } from '@/components/form/image-upload-field';
import GoogleLocationPicker, {
    PickedLocation,
} from '@/components/google-location-picker';
import { useFormToast } from '@/components/use-form-toast';
import type { HomeFeature, HomeStat } from '@/types';
import { Form, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

// Shared control styling for the inline repeatable stats/features editors, kept
// consistent with the plain TextField look used elsewhere on this page.
const rowInputClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-gray-900 dark:text-slate-100';
const rowButtonClass =
    'shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-gray-800';
const addBtnClass =
    'rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700';

// Feature icon keys offered to the admin; must match ICON_MAP in
// components/home/feature-grid.tsx so the chosen icon actually renders.
const FEATURE_ICONS: Array<{ value: string; label: string }> = [
    { value: 'faculty', label: 'Faculty (people)' },
    { value: 'values', label: 'Values (heart)' },
    { value: 'facilities', label: 'Facilities (building)' },
    { value: 'classes', label: 'Classes (graduation)' },
];

function buildEmbedUrl(lat: number, lng: number, zoom: number): string {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

interface SiteSettingRecord {
    id?: number;
    brand_name: string;
    brand_short_name: string;
    tagline?: string | null;
    logo_url?: string | null;
    favicon_url?: string | null;
    home_title?: string | null;
    home_subtitle?: string | null;
    home_cta_primary?: string | null;
    home_cta_secondary?: string | null;
    home_hero_image?: string | null;
    home_stats?: HomeStat[] | null;
    home_features?: HomeFeature[] | null;
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
    // stored as JSON on the single site_settings row. They're held in local
    // state and rendered as named inputs (home_stats[i][value], ...) so the
    // surrounding <Form> serializes them into arrays on submit.
    const [stats, setStats] = useState<HomeStat[]>(settings.home_stats ?? []);
    const [features, setFeatures] = useState<HomeFeature[]>(
        settings.home_features ?? [],
    );

    const updateStat = (index: number, key: keyof HomeStat, value: string) =>
        setStats((prev) =>
            prev.map((row, i) =>
                i === index ? { ...row, [key]: value } : row,
            ),
        );

    const updateFeature = (
        index: number,
        key: keyof HomeFeature,
        value: string,
    ) =>
        setFeatures((prev) =>
            prev.map((row, i) =>
                i === index ? { ...row, [key]: value } : row,
            ),
        );

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
                                    defaultValue={
                                        settings.home_cta_primary ?? ''
                                    }
                                />
                                <TextField
                                    label="Secondary CTA"
                                    name="home_cta_secondary"
                                    error={errors.home_cta_secondary}
                                    defaultValue={
                                        settings.home_cta_secondary ?? ''
                                    }
                                />
                            </div>
                            <TextField
                                label="Hero image URL"
                                name="home_hero_image"
                                error={errors.home_hero_image}
                                placeholder="https://..."
                                defaultValue={settings.home_hero_image ?? ''}
                            />

                            {/* Quick stats bar: admin-defined trust numbers shown
                                under the hero on the public home page. */}
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Quick stats
                                    </span>
                                    <button
                                        type="button"
                                        className={addBtnClass}
                                        onClick={() =>
                                            setStats((prev) => [
                                                ...prev,
                                                { value: '', label: '' },
                                            ])
                                        }
                                    >
                                        Add stat
                                    </button>
                                </div>
                                {stats.map((stat, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-wrap items-center gap-2"
                                    >
                                        <input
                                            className={rowInputClass}
                                            name={`home_stats[${index}][value]`}
                                            value={stat.value}
                                            onChange={(event) =>
                                                updateStat(
                                                    index,
                                                    'value',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="1,200+"
                                        />
                                        <input
                                            className={rowInputClass}
                                            name={`home_stats[${index}][label]`}
                                            value={stat.label}
                                            onChange={(event) =>
                                                updateStat(
                                                    index,
                                                    'label',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Students"
                                        />
                                        <button
                                            type="button"
                                            className={rowButtonClass}
                                            onClick={() =>
                                                setStats((prev) =>
                                                    prev.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                )
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Why-choose-us feature grid: icon cards shown on
                                the public home page. */}
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Why choose us (features)
                                    </span>
                                    <button
                                        type="button"
                                        className={addBtnClass}
                                        onClick={() =>
                                            setFeatures((prev) => [
                                                ...prev,
                                                {
                                                    icon: 'faculty',
                                                    title: '',
                                                    description: '',
                                                },
                                            ])
                                        }
                                    >
                                        Add feature
                                    </button>
                                </div>
                                {features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <select
                                                className={rowInputClass}
                                                name={`home_features[${index}][icon]`}
                                                value={
                                                    feature.icon ?? 'faculty'
                                                }
                                                onChange={(event) =>
                                                    updateFeature(
                                                        index,
                                                        'icon',
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                {FEATURE_ICONS.map((icon) => (
                                                    <option
                                                        key={icon.value}
                                                        value={icon.value}
                                                    >
                                                        {icon.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                className={rowInputClass}
                                                name={`home_features[${index}][title]`}
                                                value={feature.title}
                                                onChange={(event) =>
                                                    updateFeature(
                                                        index,
                                                        'title',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Feature title"
                                            />
                                            <button
                                                type="button"
                                                className={rowButtonClass}
                                                onClick={() =>
                                                    setFeatures((prev) =>
                                                        prev.filter(
                                                            (_, i) =>
                                                                i !== index,
                                                        ),
                                                    )
                                                }
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <textarea
                                            className={`${rowInputClass} h-16`}
                                            name={`home_features[${index}][description]`}
                                            value={feature.description}
                                            onChange={(event) =>
                                                updateFeature(
                                                    index,
                                                    'description',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Short description"
                                        />
                                    </div>
                                ))}
                            </div>
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
                                    defaultValue={
                                        settings.contact_phone_primary ?? ''
                                    }
                                />
                                <TextField
                                    label="Secondary phone"
                                    name="contact_phone_secondary"
                                    error={errors.contact_phone_secondary}
                                    defaultValue={
                                        settings.contact_phone_secondary ?? ''
                                    }
                                />
                            </div>
                            <TextField
                                label="Address"
                                name="address"
                                error={errors.address}
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                            />

                            <GoogleLocationPicker
                                apiKey={mapsKey ?? ''}
                                latitude={latitude}
                                longitude={longitude}
                                zoom={zoom}
                                onChange={handlePick}
                            />

                            {/* Persisted coordinates. */}
                            <input
                                type="hidden"
                                name="map_latitude"
                                value={latitude ?? ''}
                            />
                            <input
                                type="hidden"
                                name="map_longitude"
                                value={longitude ?? ''}
                            />
                            <input type="hidden" name="map_zoom" value={zoom} />

                            {mapsKey ? (
                                // With a key the embed URL is derived from the pin.
                                <input
                                    type="hidden"
                                    name="map_embed_url"
                                    value={embedUrl}
                                />
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
                                    defaultValue={
                                        settings.social_facebook ?? ''
                                    }
                                />
                                <TextField
                                    label="Instagram"
                                    name="social_instagram"
                                    error={errors.social_instagram}
                                    defaultValue={
                                        settings.social_instagram ?? ''
                                    }
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
