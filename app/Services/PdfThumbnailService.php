<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Exception\ExceptionInterface as ProcessException;
use Symfony\Component\Process\Process;

/**
 * Renders the first page of a PDF into a thumbnail image using the `pdftoppm`
 * binary (poppler-utils). The PHP imagick extension is not required.
 *
 * Every method degrades gracefully: if the binary is missing or rendering
 * fails, the caller simply gets `null` and can fall back to a manual cover.
 */
class PdfThumbnailService
{
    private const BINARY = 'pdftoppm';

    private const DISK = 'public';

    /**
     * Generate a thumbnail from the PDF stored at $pdfPath (relative to the
     * public disk) and persist it at $destinationPath (also on the public
     * disk). Returns the stored relative path, or null on any failure.
     */
    public function generate(string $pdfPath, string $destinationPath): ?string
    {
        $absolute = Storage::disk(self::DISK)->path($pdfPath);

        if (! is_file($absolute)) {
            return null;
        }

        $tempDir = sys_get_temp_dir().'/book-thumb-'.bin2hex(random_bytes(6));

        if (! is_dir($tempDir)) {
            @mkdir($tempDir, 0755, true);
        }

        // `pdftoppm -singlefile` writes "<prefix>.png" for the first page only.
        $prefix = $tempDir.'/page';
        $png = $prefix.'.png';

        $thumbnail = null;

        try {
            $process = new Process([
                self::BINARY,
                '-png',
                '-f', '1',
                '-l', '1',
                '-singlefile',
                '-r', '96',
                $absolute,
                $prefix,
            ]);

            $process->setTimeout(30);
            $process->run();

            if ($process->isSuccessful() && is_file($png)) {
                $contents = file_get_contents($png);

                if ($contents !== false) {
                    Storage::disk(self::DISK)->put($destinationPath, $contents);
                    $thumbnail = $destinationPath;
                }
            }
        } catch (ProcessException) {
            // Binary not installed or not executable.
        } finally {
            if (is_file($png)) {
                @unlink($png);
            }

            @rmdir($tempDir);
        }

        return $thumbnail;
    }

    /**
     * Publicly reachable URL for a path stored on the public disk.
     */
    public function url(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        return Storage::disk(self::DISK)->url($path);
    }
}
