<?php

declare(strict_types=1);

namespace App\Support\OAuth;

use Laravel\Passport\Bridge\Client as PassportBridgeClient;
use League\OAuth2\Server\Entities\ClientEntityInterface;

class FlexibleBridgeClient extends PassportBridgeClient implements ClientEntityInterface
{
    /**
     * Returns the registered redirect URI(s).
     *
     * Google/Gemini Spark uses dynamic relay paths such as:
     * https://oauth-redirect.googleusercontent.com/r/user_bound_custom-mcp-...
     *
     * The League OAuth2 server uses strict exact-string comparison (`in_array(..., true)`).
     * If the client has registered `https://oauth-redirect.googleusercontent.com` (or any path
     * under that origin) and the incoming request is directed to `oauth-redirect.googleusercontent.com`,
     * dynamically allow the specific relay redirect URI so the handshake succeeds.
     *
     * @return string|string[]
     */
    public function getRedirectUri(): string|array
    {
        $uris = (array) $this->redirectUri;
        $incoming = request()?->query('redirect_uri');

        if (is_string($incoming) && $incoming !== '') {
            $incomingHost = parse_url($incoming, PHP_URL_HOST);

            if ($incomingHost === 'oauth-redirect.googleusercontent.com') {
                foreach ($uris as $registered) {
                    if (is_string($registered) && parse_url($registered, PHP_URL_HOST) === 'oauth-redirect.googleusercontent.com') {
                        if (! in_array($incoming, $uris, true)) {
                            $uris[] = $incoming;
                        }
                        break;
                    }
                }
            }
        }

        return $uris;
    }
}
