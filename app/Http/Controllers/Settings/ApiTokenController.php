<?php

namespace App\Http\Controllers\Settings;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApiTokenController
{
    public function index(Request $request): Response
    {
        return Inertia::render('settings/api', [
            'tokens' => $request->user()->tokens()
                ->latest('created_at')
                ->get(['id', 'name', 'last_used_at', 'created_at']),
            'newToken' => fn () => $request->session()->pull('newToken'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $token = $request->user()->createToken($validated['name']);

        return to_route('api-tokens.index')->with('newToken', $token->plainTextToken);
    }

    public function destroy(Request $request, string $token): RedirectResponse
    {
        $request->user()->tokens()->whereKey($token)->firstOrFail()->delete();

        return to_route('api-tokens.index')->with('status', 'token-deleted');
    }
}
