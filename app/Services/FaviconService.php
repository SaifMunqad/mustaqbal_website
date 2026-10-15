<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Intervention\Image\Encoders\PngEncoder;
use Intervention\Image\ImageManager;
use Throwable;

/**
 * Derives the site's icon assets (favicon + apple-touch + a real .ico) from the
 * admin-uploaded logo, so a single PNG drives every system icon and no separate
 * favicon upload is needed.
 *
 * Uses Intervention Image with the built-in GD driver — no system binaries or the
 * imagick extension required. Every method degrades gracefully: if the logo can't
 * be read or rendering fails, the caller simply keeps the previous assets (or the
 * bundled /favicon.ico fallback) instead of throwing.
 */
class FaviconService
{
    private const DISK = 'public';

    private const DIR = 'branding';

    /**
     * Square favicon sizes generated as standalone PNGs, keyed by pixel size.
     *
     * @var list<int>
     */
    private const PNG_SIZES = [16, 32, 48, 192];

    /**
     * The single high-resolution PNG sizes bundled into the .ico container.
     *
     * @var list<int>
     */
    private const ICO_SIZES = [16, 32, 48];

    private const APPLE_SIZE = 180;

    public function __construct(private readonly ImageManager $images)
    {
    }

    /**
     * Rebuild every icon asset from the logo URL. Returns true when the full set
     * was written, false when the source is missing/unreadable or any step failed.
     */
    public function regenerate(?string $logoUrl): bool
    {
        $source = $this->resolveSource($logoUrl);

        if ($source === null) {
            return false;
        }

        /** @var array<int, string> $icoPngs */
        $icoPngs = [];

        foreach ($this->targets() as [$size, $filename]) {
            $bytes = $this->renderSquare($source, $size);

            if ($bytes === null) {
                return false;
            }

            Storage::disk(self::DISK)->put(self::DIR.'/'.$filename, $bytes);

            if (in_array($size, self::ICO_SIZES, true)) {
                $icoPngs[$size] = $bytes;
            }
        }

        try {
            Storage::disk(self::DISK)->put(self::DIR.'/favicon.ico', $this->buildIco($icoPngs));
        } catch (Throwable) {
            return false;
        }

        return true;
    }

    /**
     * Whether the generated set already exists (used to decide if a first run is
     * required even when the logo itself has not changed).
     */
    public function exists(): bool
    {
        return Storage::disk(self::DISK)->exists(self::DIR.'/favicon.ico');
    }

    /**
     * Remove the generated assets so the bundled fallback icons take over again.
     */
    public function clear(): void
    {
        Storage::disk(self::DISK)->deleteDirectory(self::DIR);
    }

    /**
     * The (size, filename) pairs to render.
     *
     * @return list<array{int, string}>
     */
    private function targets(): array
    {
        $targets = [];

        foreach (self::PNG_SIZES as $size) {
            $targets[] = [$size, "favicon-{$size}.png"];
        }

        $targets[] = [self::APPLE_SIZE, 'apple-touch-icon.png'];

        return $targets;
    }

    /**
     * Composite the logo centered on a transparent square canvas and return its
     * PNG bytes, or null on any failure.
     */
    private function renderSquare(string $absoluteSource, int $size): ?string
    {
        try {
            $canvas = $this->images->createImage($size, $size);
            $logo = $this->images->decodePath($absoluteSource)->scaleDown($size, $size);
            $canvas->insert($logo, 0, 0, 'center');

            return (string) $canvas->encode(new PngEncoder());
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Resolve a stored logo URL to an absolute path on the public disk, or null
     * when it points somewhere other than a readable local file.
     */
    private function resolveSource(?string $logoUrl): ?string
    {
        if (blank($logoUrl)) {
            return null;
        }

        // Logo values are app-relative URLs (e.g. /storage/uploads/x.png); accept
        // an absolute form too and reduce it to the on-disk relative path.
        $path = parse_url($logoUrl, PHP_URL_PATH) ?: $logoUrl;
        $path = ltrim((string) $path, '/');

        foreach (['storage/', ''] as $prefix) {
            if ($prefix !== '' && str_starts_with($path, $prefix)) {
                $path = substr($path, strlen($prefix));

                break;
            }
        }

        if (! Storage::disk(self::DISK)->exists($path)) {
            return null;
        }

        return Storage::disk(self::DISK)->path($path);
    }

    /**
     * Assemble a valid .ico file by embedding the per-size PNGs (PNG-in-ICO is
     * supported by every modern browser and all Windows since Vista).
     *
     * @param  array<int, string>  $pngs  size => PNG bytes
     */
    private function buildIco(array $pngs): string
    {
        ksort($pngs);

        $count = count($pngs);
        $header = pack('vvv', 0, 1, $count);

        $entries = '';
        $data = '';
        $offset = 6 + $count * 16;

        foreach ($pngs as $size => $png) {
            $dimension = $size >= 256 ? 0 : $size;
            $length = strlen($png);

            // width, height, colorCount, reserved, planes, bitCount, bytesInRes, imageOffset
            $entries .= pack('CCCCvvVV', $dimension, $dimension, 0, 0, 1, 32, $length, $offset);
            $data .= $png;
            $offset += $length;
        }

        return $header.$entries.$data;
    }
}
