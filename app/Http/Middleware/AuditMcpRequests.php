<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Writes one structured audit line per MCP request to the daily `mcp_audit`
 * channel: who acted (the Sanctum user the token maps to), which JSON-RPC
 * method / tool was invoked, whether it errored, and how long it took.
 *
 * Placed *after* auth so the acting user is known, and it deliberately records
 * only the tool name and a hash of the arguments — payloads can contain
 * personal enrolment/contact data, which belongs in the database, not logs.
 */
class AuditMcpRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        $response = $next($request);

        try {
            $this->record($request, $response, $start);
        } catch (\Throwable) {
            // Auditing must never break the call it is auditing.
        }

        return $response;
    }

    private function record(Request $request, Response $response, float $start): void
    {
        $body = json_decode($request->getContent(), true);

        if (! is_array($body)) {
            return;
        }

        $payload = json_decode((string) $response->getContent(), true);

        $isError = is_array($payload)
            && (isset($payload['error']) || ($payload['result']['isError'] ?? false) === true);

        $tool = (string) ($body['params']['name'] ?? '');
        $arguments = is_array($body['params']['arguments'] ?? null) ? $body['params']['arguments'] : null;

        // Catalog calls arrive wrapped in execute_tools; the tools it actually
        // ran are the interesting audit subjects, so record their names too.
        $calls = $tool === 'execute_tools'
            ? array_values(array_map(
                static fn (array $call): string => (string) ($call['name'] ?? ''),
                is_array($arguments['calls'] ?? null) ? $arguments['calls'] : [],
            ))
            : null;

        Log::channel('mcp_audit')->info('mcp.call', [
            'user_id' => $request->user()?->id,
            'method' => (string) ($body['method'] ?? ''),
            'tool' => $tool,
            'calls' => $calls,
            'args_hash' => $arguments !== null
                ? substr(md5((string) json_encode($arguments, JSON_UNESCAPED_UNICODE)), 0, 12)
                : null,
            'error' => $isError,
            'duration_ms' => (int) round((microtime(true) - $start) * 1000),
            'ip' => $request->ip(),
        ]);
    }
}
