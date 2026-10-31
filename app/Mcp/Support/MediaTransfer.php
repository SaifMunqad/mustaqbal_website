<?php

declare(strict_types=1);

namespace App\Mcp\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Laravel\Mcp\Response as McpResponse;

/**
 * Turns MCP JSON arguments into a real {@see UploadedFile} so file-validating
 * dashboard endpoints (uploads, book PDFs, font families) stay the single
 * source of truth: the tool layer only transports bytes, every storage rule,
 * size cap and mimetype check still runs in the existing FormRequest.
 *
 * Callers pass either a public `url` (downloaded server-side) or `base64`
 * content plus a `filename` whose extension drives the mime rules.
 */
class MediaTransfer
{
    /** Hard cap on transferred bytes; the FormRequest applies the real, per-endpoint limit. */
    private const MAX_BYTES = 25 * 1024 * 1024;

    /**
     * Resolve `url` / `base64` + `filename` arguments into an in-memory upload.
     *
     * @param  array<string, mixed>  $args
     * @return UploadedFile|McpResponse the file, or an MCP error explaining what went wrong
     */
    public static function resolve(array $args): UploadedFile|McpResponse
    {
        if (filled($args['url'] ?? null)) {
            return self::fromUrl((string) $args['url'], $args['filename'] ?? null);
        }

        if (filled($args['base64'] ?? null)) {
            return self::fromBase64((string) $args['base64'], (string) ($args['filename'] ?? ''));
        }

        return McpResponse::error('Provide either a "url" or "base64" content with a "filename".');
    }

    private static function fromUrl(string $url, ?string $filename): UploadedFile|McpResponse
    {
        $parts = parse_url($url);

        if ($parts === false || ! in_array($parts['scheme'] ?? '', ['http', 'https'], true)) {
            return McpResponse::error('Only http(s) URLs can be transferred.');
        }

        $host = $parts['host'] ?? '';
        $port = $parts['port'] ?? null;

        if ($host === '' || ($port !== null && ! in_array($port, [80, 443], true))) {
            return McpResponse::error('Only standard http(s) ports (80, 443) can be transferred from.');
        }

        // SSRF guard: every address the host resolves to must be publicly
        // routable, so an agent-supplied URL can never reach loopback,
        // private-network or link-local (cloud metadata) services.
        if (($refusal = self::assertPublicHost($host)) !== null) {
            return McpResponse::error($refusal);
        }

        try {
            // Redirects are never followed: a public URL answering with a
            // private Location: would bypass the check above, so a 3xx is
            // simply refused and the caller must supply the final URL.
            $response = Http::timeout(30)->withOptions(['allow_redirects' => false])->get($url);
        } catch (\Throwable) {
            return McpResponse::error('The URL could not be downloaded.');
        }

        if ($response->status() >= 300 && $response->status() < 400) {
            return McpResponse::error('The URL redirects; pass the final URL directly instead.');
        }

        if ($response->failed()) {
            return McpResponse::error('The URL responded with HTTP '.$response->status().'.');
        }

        $contents = $response->body();

        if (strlen($contents) > self::MAX_BYTES) {
            return McpResponse::error('The remote file exceeds the 25MB transfer limit.');
        }

        $name = $filename !== null && $filename !== ''
            ? $filename
            : (basename((string) parse_url($url, PHP_URL_PATH)) ?: 'media');

        return self::store($contents, $name);
    }

    /**
     * Resolve a host and refuse it unless every address is publicly routable.
     * Returns an error message, or null when the host is safe to fetch.
     */
    private static function assertPublicHost(string $host): ?string
    {
        $refused = "The host [{$host}] resolves to a private or reserved address, which cannot be transferred from.";

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false
                ? $refused
                : null;
        }

        $records = @dns_get_record($host, DNS_A | DNS_AAAA) ?: [];
        $addresses = array_values(array_filter(array_map(
            static fn (array $record): ?string => $record['ip'] ?? $record['ipv6'] ?? null,
            $records,
        )));

        if ($addresses === []) {
            return "The host [{$host}] could not be resolved.";
        }

        foreach ($addresses as $address) {
            if (filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
                return $refused;
            }
        }

        return null;
    }

    private static function fromBase64(string $base64, string $filename): UploadedFile|McpResponse
    {
        // Tolerate data-URI prefixes (`data:image/png;base64,...`) from agents.
        $payload = preg_replace('#^data:[^,]+,+#', '', $base64) ?? $base64;

        $contents = base64_decode($payload, true);

        if ($contents === false) {
            return McpResponse::error('"base64" content is not valid base64.');
        }

        if (strlen($contents) > self::MAX_BYTES) {
            return McpResponse::error('The decoded file exceeds the 25MB transfer limit.');
        }

        return self::store($contents, $filename);
    }

    private static function store(string $contents, string $filename): UploadedFile|McpResponse
    {
        if (pathinfo($filename, PATHINFO_EXTENSION) === '') {
            return McpResponse::error('"filename" must keep its extension (e.g. hero.jpg) so the dashboard mime rules can run.');
        }

        $path = tempnam(sys_get_temp_dir(), 'mcp-media-');

        if ($path === false) {
            return McpResponse::error('The transfer could not be buffered server-side.');
        }

        file_put_contents($path, $contents);

        return new UploadedFile($path, $filename, null, null, true);
    }
}
