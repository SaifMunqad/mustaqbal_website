/**
 * Map + search picker used by the site-settings contact section.
 *
 * Renders only after mount (the Maps SDK is not SSR-safe). Without a Google Maps
 * API key it renders a translated notice instead of the map, so the surrounding
 * form still lays out correctly and the admin knows why nothing appears. Emits the
 * full location object — coordinates, zoom and the human-readable address — so the
 * address does not have to be looked up separately.
 */
import { Autocomplete, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

// Client-only gate without a mount effect: the server snapshot is false (render
// the placeholder) and the client snapshot is true (render the map), giving the
// same "loading then map" sequence while staying SSR-safe.
const emptySubscribe = () => () => {};

export interface PickedLocation {
    latitude: number;
    longitude: number;
    zoom: number;
    address?: string;
}

interface GoogleLocationPickerProps {
    apiKey: string;
    latitude?: number | null;
    longitude?: number | null;
    zoom?: number | null;
    onChange: (location: PickedLocation) => void;
}

// Fallback center (Kabul) used only when no coordinates have been saved yet.
const DEFAULT_CENTER = { lat: 34.5553, lng: 69.2075 };
const DEFAULT_ZOOM = 15;

const containerStyle = { width: '100%', height: '320px' };

/**
 * Interactive Google Maps picker: a Places autocomplete box plus a draggable /
 * clickable marker. Emits the chosen coordinates so the caller can persist them
 * and derive a keyless embed URL for the public page.
 *
 * Rendered only on the client (see the guard in the default export) so it stays
 * safe under Inertia SSR, where `window`/`document` are unavailable.
 */
function PickerInner({ apiKey, latitude, longitude, zoom, onChange }: GoogleLocationPickerProps) {
    const { t } = useTranslation();
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'school-location-picker',
        googleMapsApiKey: apiKey,
        libraries: ['places'] as unknown as never,
    });

    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [center, setCenter] = useState(() => ({
        lat: latitude ?? DEFAULT_CENTER.lat,
        lng: longitude ?? DEFAULT_CENTER.lng,
    }));
    const [currentZoom, setCurrentZoom] = useState(zoom ?? DEFAULT_ZOOM);

    // Keep the marker centred on the latest saved coordinates from the parent,
    // adjusting state during render (instead of an effect) per React's
    // derived-state guidance.
    const [syncKey, setSyncKey] = useState({ latitude, longitude });
    if (
        latitude != null &&
        longitude != null &&
        (syncKey.latitude !== latitude || syncKey.longitude !== longitude)
    ) {
        setSyncKey({ latitude, longitude });
        setCenter({ lat: latitude, lng: longitude });
    }

    const emit = (lat: number, lng: number, nextZoom: number, address?: string) => {
        setCenter({ lat, lng });
        setCurrentZoom(nextZoom);
        onChange({ latitude: lat, longitude: lng, zoom: nextZoom, address });
    };

    const handlePlaceSelected = () => {
        const place = autocompleteRef.current?.getPlace();
        const location = place?.geometry?.location;

        if (!location) {
            return;
        }

        emit(location.lat(), location.lng(), currentZoom, place.formatted_address);
    };

    const mapOptions = useMemo(
        () => ({
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
        }),
        [],
    );

    if (loadError) {
        return (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {t('dashboard.settings.form.mapLoadError')}
            </p>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex h-[320px] items-center justify-center rounded-xl border text-sm text-slate-500">
                {t('dashboard.settings.form.mapLoading')}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Autocomplete
                onLoad={(instance) => {
                    autocompleteRef.current = instance;
                }}
                onPlaceChanged={handlePlaceSelected}
            >
                <input
                    type="text"
                    placeholder={t(
                        'dashboard.settings.form.mapSearchPlaceholder',
                    )}
                    className="w-full rounded-lg border p-2"
                />
            </Autocomplete>

            <div className="overflow-hidden rounded-xl border">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={currentZoom}
                    options={mapOptions}
                    onClick={(event) => {
                        const location = event.latLng;
                        if (location) {
                            emit(location.lat(), location.lng(), currentZoom);
                        }
                    }}
                >
                    <Marker
                        position={center}
                        draggable
                        onDragEnd={(event) => {
                            const location = event.latLng;
                            if (location) {
                                emit(location.lat(), location.lng(), currentZoom);
                            }
                        }}
                    />
                </GoogleMap>
            </div>

            <p className="text-xs text-slate-500">
                {t('dashboard.settings.form.mapSearchHint')}
            </p>
        </div>
    );
}

export default function GoogleLocationPicker(props: GoogleLocationPickerProps) {
    const { t } = useTranslation();

    // Defer the map to the client only; keeps SSR from touching window/document.
    const mounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );

    if (!props.apiKey) {
        return (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                {t('dashboard.settings.form.mapMissingKey')}
            </p>
        );
    }

    if (!mounted) {
        return (
            <div className="flex h-[320px] items-center justify-center rounded-xl border text-sm text-slate-500">
                {t('dashboard.settings.form.mapLoading')}
            </div>
        );
    }

    return <PickerInner {...props} />;
}
