<!DOCTYPE html>
@php
    use App\Models\SiteSetting;$locale = app()->getLocale();
    $dir = \App\Models\Language::dirFor($locale);
    $icons = SiteSetting::current()->iconAssets();
    $favicon = $icons['ico'] ?? $icons['favicon_32'] ?? null;
    // Branding palette (light + dark tokens). Falls back to the app.css values
    // when the settings table/columns are not available yet.
    try {
        $palette = SiteSetting::current()->palette();
    } catch (\Throwable) {
        $palette = null;
    }
    // Per-language typeface chosen in the dashboard. Null means the language
    // uses the built-in stack declared in app.css (Noto Naskh Arabic).
    try {
        $typography = \App\Models\Language::typographyFor($locale);
    } catch (\Throwable) {
        $typography = null;
    }
@endphp
<html lang="{{ str_replace('_', '-', $locale) }}" dir="{{ $dir }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? "system" }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Inline style to set the HTML background color. --app-bg is frozen in
         app.css (white in light mode, dark gray in dark mode) so overscroll
         always matches the page and never follows the school's brand color. --}}
    <style>
      html {
        background-color: var(--app-bg, #fdfdfc);
      }
    </style>

    @if ($palette)
        {{-- Branding palette derived from the school's brand color, emitted
             before first paint so there is no flash of the default blue. --}}
        <style id="brand-palette">{!! \App\Support\Theme\BrandPalette::toCss($palette) !!}</style>
        <meta name="theme-color" content="{{ $palette['light']['--brand'] }}">
    @endif

    @if ($typography)
        {{-- Uploaded typeface for the active language: its @font-face rules plus
             the --app-font-active stack. Emitted before first paint so text
             never flashes in the fallback font. A curated Google Font instead
             links its stylesheet, so only that family is downloaded. --}}
        @if (! empty($typography['href']))
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link rel="stylesheet" href="{{ $typography['href'] }}">
        @endif
        <style id="app-font">{!! \App\Support\Typography\FontStyles::css($typography) !!}</style>
    @endif

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    @if ($favicon)
        {{-- Icons generated from the logo: a real .ico plus sized PNGs. --}}
        <link rel="icon" href="{{ $favicon }}" sizes="any">
        @isset ($icons['favicon_16'])<link rel="icon" type="image/png" sizes="16x16" href="{{ $icons['favicon_16'] }}">@endisset
        @isset ($icons['favicon_32'])<link rel="icon" type="image/png" sizes="32x32" href="{{ $icons['favicon_32'] }}">@endisset
        @isset ($icons['favicon_48'])<link rel="icon" type="image/png" sizes="48x48" href="{{ $icons['favicon_48'] }}">@endisset
        @isset ($icons['favicon_192'])<link rel="icon" type="image/png" sizes="192x192" href="{{ $icons['favicon_192'] }}">@endisset
    @else
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    @endif
    <link rel="apple-touch-icon" href="{{ $icons['apple_touch'] ?? '/apple-touch-icon.png' }}">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>
<body class="font-sans overflow-hidden antialiased">
@inertia
</body>
</html>
