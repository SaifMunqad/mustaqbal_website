<?php

namespace App\Support\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/**
 * Accepts only real font binaries.
 *
 * `mimes:`/`mimetypes:` are unreliable here because the MIME reported for
 * `.ttf` and `.otf` varies by platform (often `application/octet-stream`), so
 * the first four bytes of the file are checked against the format's signature
 * instead. That also rejects an image or archive renamed to `.woff2`.
 */
class FontFile implements ValidationRule
{
    /**
     * Accepted file signature per extension.
     *
     * @var array<string, list<string>>
     */
    private const SIGNATURES = [
        'woff2' => ["\x77\x4F\x46\x32"],          // wOF2
        'woff' => ["\x77\x4F\x46\x46"],           // wOFF
        'ttf' => ["\x00\x01\x00\x00", 'true'],   // TrueType / Apple TrueType
        'otf' => ['OTTO'],                      // CFF OpenType
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile || ! $value->isValid()) {
            $fail('The :attribute must be a readable font file.');

            return;
        }

        $extension = strtolower($value->getClientOriginalExtension());

        if (! isset(self::SIGNATURES[$extension])) {
            $fail('The :attribute must be a .woff2, .woff, .ttf or .otf font file.');

            return;
        }

        $handle = @fopen($value->getRealPath(), 'rb');
        $head = $handle === false ? '' : (string) fread($handle, 4);

        if ($handle !== false) {
            fclose($handle);
        }

        if (! in_array($head, self::SIGNATURES[$extension], true)) {
            $fail('The :attribute does not look like a valid .'.$extension.' font file.');
        }
    }
}
