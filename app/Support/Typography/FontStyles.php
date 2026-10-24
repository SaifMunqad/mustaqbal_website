<?php

namespace App\Support\Typography;

/**
 * Builds the `<style id="app-font">` payload for the active language.
 *
 * Emitted inline in the root Blade view before first paint, so the admin's
 * typeface is applied on the first rendered frame instead of flashing the
 * fallback. Only the active language's family is shipped — a Dari-only font
 * must not be downloaded by English visitors.
 *
 * Every value interpolated here is constrained upstream: the family name is
 * stripped to `[A-Za-z0-9 _-]` by {@see \App\Models\Font::cssFamily()}, file
 * formats come from a fixed allow-list, and weights/styles are integers and
 * enums stored by the upload controller.
 */
final class FontStyles
{
    /**
     * @param  array{family: string, stack: string, faces: list<array{weight: int, style: string, url: string, format: string}>}  $typography
     */
    public static function css(array $typography): string
    {
        $rules = '';

        foreach ($typography['faces'] as $face) {
            $rules .= sprintf(
                "@font-face{font-family:'%s';font-style:%s;font-weight:%d;font-display:swap;src:url('%s') format('%s')}",
                $typography['family'],
                $face['style'],
                $face['weight'],
                $face['url'],
                $face['format'],
            );
        }

        return $rules.':root{--app-font-active:'.$typography['stack'].'}';
    }
}
