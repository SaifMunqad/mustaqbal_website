import SettingsSection from '@/components/dashboard/site-settings/settings-section';
import {
    buildEmbedUrl,
    type SiteSettingsPageProps,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { useSectionDirty } from '@/components/dashboard/site-settings/use-section-dirty';
import { TextField } from '@/components/form-fields';
import GoogleLocationPicker, {
    PickedLocation,
} from '@/components/google-location-picker';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ContactSectionProps {
    active: boolean;
    onDirtyChange: (dirty: boolean) => void;
}

/**
 * Where visitors can reach the school. Shared across languages, so there are no
 * language tabs here; the map pin and the embed URL are kept in sync.
 */
export default function ContactSection({
    active,
    onDirtyChange,
}: ContactSectionProps) {
    const { settings, mapsKey } = usePage<SiteSettingsPageProps>().props;
    const { t } = useTranslation();

    const [email, setEmail] = useState(settings.contact_email ?? '');
    const [phonePrimary, setPhonePrimary] = useState(
        settings.contact_phone_primary ?? '',
    );
    const [phoneSecondary, setPhoneSecondary] = useState(
        settings.contact_phone_secondary ?? '',
    );

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

    const { dirty, markSaved } = useSectionDirty(
        {
            email,
            phonePrimary,
            phoneSecondary,
            address,
            latitude,
            longitude,
            zoom,
            embedUrl,
        },
        onDirtyChange,
    );

    return (
        <SettingsSection
            section="contact"
            active={active}
            dirty={dirty}
            onSaved={markSaved}
        >
            {({ errors }) => (
                <>
                    <TextField
                        label={t('dashboard.settings.form.email')}
                        name="contact_email"
                        type="email"
                        error={errors.contact_email}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                        <TextField
                            label={t('dashboard.settings.form.primaryPhone')}
                            name="contact_phone_primary"
                            error={errors.contact_phone_primary}
                            value={phonePrimary}
                            onChange={(event) =>
                                setPhonePrimary(event.target.value)
                            }
                        />
                        <TextField
                            label={t('dashboard.settings.form.secondaryPhone')}
                            name="contact_phone_secondary"
                            error={errors.contact_phone_secondary}
                            value={phoneSecondary}
                            onChange={(event) =>
                                setPhoneSecondary(event.target.value)
                            }
                        />
                    </div>

                    <TextField
                        label={t('dashboard.settings.form.address')}
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
                            label={t('dashboard.settings.form.mapEmbedUrl')}
                            name="map_embed_url"
                            error={errors.map_embed_url}
                            placeholder={t(
                                'dashboard.settings.form.mapEmbedPlaceholder',
                            )}
                            value={embedUrl}
                            onChange={(event) =>
                                setEmbedUrl(event.target.value)
                            }
                            hint={t('dashboard.settings.form.mapEmbedHint')}
                        />
                    )}
                </>
            )}
        </SettingsSection>
    );
}
