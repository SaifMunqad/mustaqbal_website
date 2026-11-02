<?php

declare(strict_types=1);

namespace App\Support\OAuth;

use Laravel\Passport\Bridge\Client as PassportBridgeClient;
use Laravel\Passport\Bridge\ClientRepository as PassportBridgeClientRepository;
use Laravel\Passport\Client as ClientModel;
use League\OAuth2\Server\Entities\ClientEntityInterface;

class FlexibleBridgeClientRepository extends PassportBridgeClientRepository
{
    /**
     * Create a new client entity from the given client model instance.
     *
     * IMPORTANT: Must return an instance of `Laravel\Passport\Bridge\Client` directly
     * (not a subclass), because `RetrievesAuthRequestFromSession::getAuthRequestFromSession`
     * uses strict `unserialize($authRequest, ['allowed_classes' => [...]])` that only allows
     * `Laravel\Passport\Bridge\Client::class`. Any subclass is deserialized as `__PHP_Incomplete_Class`
     * and causes a TypeError when approving authorization.
     */
    protected function fromClientModel(ClientModel $model): ClientEntityInterface
    {
        $uris = (array) $model->redirect_uris;
        $incoming = request()?->query('redirect_uri');

        // If the client has registered Google's relay host (or if the incoming URI points to it),
        // dynamically include the specific relay path (e.g. /r/user_bound_custom-mcp-...)
        // so that League's strict RedirectUriValidator passes.
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

        return new PassportBridgeClient(
            $model->getKey(),
            $model->name,
            $uris,
            $model->confidential(),
            $model->provider,
            $model->grant_types
        );
    }
}
