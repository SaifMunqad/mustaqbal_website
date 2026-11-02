<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="ltr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Authorize {{ $client->name }} &mdash; {{ config('app.name', 'Mustaqbal') }}</title>
    <style>
        :root {
            --primary: #0284c7;
            --primary-hover: #0369a1;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --danger: #ef4444;
            --danger-hover: #dc2626;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --primary: #38bdf8;
                --primary-hover: #0284c7;
                --bg: #0f172a;
                --card-bg: #1e293b;
                --text-main: #f8fafc;
                --text-muted: #94a3b8;
                --border: #334155;
            }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
        }
        .card {
            background-color: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 1rem;
            max-width: 480px;
            width: 100%;
            padding: 2rem;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        .brand-badge {
            width: 44px;
            height: 44px;
            border-radius: 0.75rem;
            background: linear-gradient(135deg, #0284c7, #6366f1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: 700;
            font-size: 1.25rem;
        }
        .title {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        .description {
            color: var(--text-muted);
            font-size: 0.95rem;
            line-height: 1.5;
            margin-bottom: 1.5rem;
        }
        .client-highlight {
            font-weight: 600;
            color: var(--text-main);
        }
        .user-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background: rgba(148, 163, 184, 0.1);
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            font-size: 0.875rem;
            margin-bottom: 1.5rem;
            width: 100%;
        }
        .scopes-box {
            background: rgba(148, 163, 184, 0.08);
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }
        .scopes-title {
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            margin-bottom: 0.5rem;
        }
        .scope-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            font-size: 0.875rem;
        }
        .actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1.5rem;
        }
        .btn {
            flex: 1;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid transparent;
            text-align: center;
            transition: all 0.15s ease-in-out;
        }
        .btn-primary {
            background-color: var(--primary);
            color: #fff;
        }
        .btn-primary:hover {
            background-color: var(--primary-hover);
        }
        .btn-secondary {
            background-color: transparent;
            border-color: var(--border);
            color: var(--text-muted);
        }
        .btn-secondary:hover {
            background-color: rgba(148, 163, 184, 0.1);
            color: var(--text-main);
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="brand">
            <div class="brand-badge">M</div>
            <div>
                <div style="font-weight: 600; font-size: 0.9rem;">{{ config('app.name', 'Mustaqbal') }}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">OAuth Authorization</div>
            </div>
        </div>

        <h1 class="title">Authorize Application</h1>
        <p class="description">
            <span class="client-highlight">{{ $client->name }}</span> is requesting permission to access your account via the Model Context Protocol.
        </p>

        <div class="user-pill">
            <span>Signed in as:</span>
            <strong>{{ $user->name ?? $user->email }}</strong>
            <span style="color: var(--text-muted); font-size: 0.8rem;">({{ $user->email }})</span>
        </div>

        @if (count($scopes) > 0)
            <div class="scopes-box">
                <div class="scopes-title">Requested Permissions</div>
                <ul class="scope-list">
                    @foreach ($scopes as $scope)
                        <li>• {{ $scope->description ?? $scope->id }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <div class="actions">
            <form method="POST" action="{{ route('passport.authorizations.deny') }}" style="flex: 1;">
                @csrf
                @method('DELETE')
                <input type="hidden" name="auth_token" value="{{ $authToken }}">
                <button type="submit" class="btn btn-secondary" style="width: 100%;">Deny</button>
            </form>

            <form method="POST" action="{{ route('passport.authorizations.approve') }}" style="flex: 1;">
                @csrf
                <input type="hidden" name="auth_token" value="{{ $authToken }}">
                <button type="submit" class="btn btn-primary" style="width: 100%;">Authorize</button>
            </form>
        </div>
    </div>
</body>
</html>
