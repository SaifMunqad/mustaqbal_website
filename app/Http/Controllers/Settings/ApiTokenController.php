<?php

namespace App\Http\Controllers\Settings;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Passport\Client;
use Laravel\Passport\ClientRepository;

class ApiTokenController
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/api', [
            'tokens' => $user->tokens()
                ->latest('created_at')
                ->get(['id', 'name', 'last_used_at', 'created_at']),
            'newToken' => fn () => $request->session()->pull('newToken'),
            'oauthClients' => $user->oauthApps()
                ->where('revoked', false)
                ->where('grant_types', '!=', '[]')
                ->latest('created_at')
                ->get(['id', 'name', 'grant_types', 'created_at'])
                ->map(function ($client) {
                    $grantTypes = json_decode($client->getRawOriginal('grant_types'), true);

                    return [
                        'id' => $client->id,
                        'name' => $client->name,
                        'grant_types' => is_array($grantTypes) ? $grantTypes : [],
                        'created_at' => $client->created_at,
                    ];
                }),
            'newOAuthClient' => fn () => $request->session()->pull('newOAuthClient'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $token = $request->user()->createToken($validated['name']);

        return to_route('api-tokens.index')->with('newToken', $token->accessToken);
    }

    public function destroy(Request $request, string $token): RedirectResponse
    {
        $request->user()->tokens()->whereKey($token)->firstOrFail()->delete();

        return to_route('api-tokens.index')->with('status', 'token-deleted');
    }

    /**
     * Create a new OAuth Password Grant client for the authenticated user.
     */
    public function storeOAuthClient(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $secret = Str::random(40);

        // Use the Client model directly so the `secret` attribute setter
        // hashes the value via Hash::make() and captures the plain secret.
        $client = new Client([
            'name' => $validated['name'],
            'secret' => $secret,
            'provider' => null,
            'redirect_uris' => [],
            'grant_types' => ['password', 'refresh_token'],
            'revoked' => false,
        ]);

        $request->user()->oauthApps()->save($client);

        return to_route('api-tokens.index')->with('newOAuthClient', [
            'id' => $client->id,
            'secret' => $client->plainSecret,
            'name' => $client->name,
        ]);
    }

    /**
     * Revoke an OAuth client owned by the authenticated user.
     */
    public function destroyOAuthClient(Request $request, string $clientId, ClientRepository $clients): RedirectResponse
    {
        $client = $clients->find($clientId);

        abort_if(! $client, 404);
        abort_if($client->owner_id !== $request->user()->id || $client->owner_type !== get_class($request->user()), 403);

        $clients->delete($client);

        return to_route('api-tokens.index')->with('status', 'oauth-client-deleted');
    }
}
