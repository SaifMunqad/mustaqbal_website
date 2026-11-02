<?php

declare(strict_types=1);

namespace App\Support\OAuth;

use Laravel\Passport\Bridge\ClientRepository as PassportBridgeClientRepository;
use Laravel\Passport\Client as ClientModel;
use League\OAuth2\Server\Entities\ClientEntityInterface;

class FlexibleBridgeClientRepository extends PassportBridgeClientRepository
{
    /**
     * Create a new client entity from the given client model instance.
     */
    protected function fromClientModel(ClientModel $model): ClientEntityInterface
    {
        return new FlexibleBridgeClient(
            $model->getKey(),
            $model->name,
            $model->redirect_uris,
            $model->confidential(),
            $model->provider,
            $model->grant_types
        );
    }
}
