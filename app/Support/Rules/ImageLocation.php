<?php

namespace App\Support\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate an image reference that may be either an absolute URL (external
 * image or asset) or an app-relative path such as "/storage/uploads/x.jpg".
 *
 * Relative paths are produced by the dashboard upload endpoint so stored assets
 * keep working regardless of the host, port or scheme used to reach the site.
 */
class ImageLocation implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $value = (string) $value;

        // App-relative path (e.g. /storage/uploads/x.webp).
        if (str_starts_with($value, '/')) {
            return;
        }

        // Absolute URL (http/https and any other scheme filter_var accepts).
        if (filter_var($value, FILTER_VALIDATE_URL) !== false) {
            return;
        }

        $fail('The :attribute must be a valid image URL or path.');
    }
}
