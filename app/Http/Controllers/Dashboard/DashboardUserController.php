<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardUserController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->string('role')->toString(), fn ($query, string $role) => $query->where('role', $role))
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('dashboard/users/index', [
            'users' => $users,
            'roleOptions' => array_map(static fn (UserRole $role): array => [
                'value' => $role->value,
                'label' => $role->label(),
                'labelKey' => $role->labelKey(),
            ], UserRole::cases()),
            'statusOptions' => array_map(static fn (UserStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
                'labelKey' => $status->labelKey(),
            ], UserStatus::cases()),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'role' => $request->string('role')->toString(),
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('dashboard/users/create', [
            'roleOptions' => $this->roleOptions($request->user()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique(User::class)],
            'role' => ['required', 'string', Rule::in($this->assignableRoleValues($request->user()))],
            'status' => ['nullable', 'string', Rule::in(UserStatus::values())],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $passwordSetManually = filled($validated['password'] ?? null);
        $status = $validated['status'] ?? UserStatus::Active->value;

        // Self-suspension on one's own newly created account makes no sense; default to active.
        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'status' => $status,
            'password' => $passwordSetManually ? $validated['password'] : Str::password(16),
        ]);

        if ($passwordSetManually) {
            $user->sendEmailVerificationNotification();

            return redirect()
                ->route('dashboard.users.index')
                ->with('success', 'Account created. A verification email was sent.');
        }

        Password::broker()->sendResetLink(['email' => $user->email]);

        return redirect()
            ->route('dashboard.users.index')
            ->with('success', 'Account created. A password setup link was emailed.');
    }

    public function edit(Request $request, User $user): Response
    {
        $this->authorize('update', $user);

        $roleOptions = $this->roleOptions($request->user());

        // Keep the account's current role selectable even if the actor cannot grant it.
        if (! in_array($user->role->value, array_column($roleOptions, 'value'), true)) {
            $roleOptions[] = ['value' => $user->role->value, 'label' => $user->role->label(), 'labelKey' => $user->role->labelKey()];
        }

        return Inertia::render('dashboard/users/edit', [
            'user' => $user,
            'roleOptions' => $roleOptions,
            'canDelete' => $request->user()->can('delete', $user),
            'statusOptions' => array_map(static fn (UserStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
                'labelKey' => $status->labelKey(),
            ], UserStatus::cases()),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $assignable = $this->assignableRoleValues($request->user());

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique(User::class)->ignore($user)],
            'role' => ['required', 'string', Rule::in($assignable)],
            'status' => ['required', 'string', Rule::in(UserStatus::values())],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if ($user->is($request->user()) && $validated['status'] === UserStatus::Suspended->value) {
            return back()->withErrors(['status' => 'You cannot suspend your own account.']);
        }

        $attributes = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'status' => $validated['status'],
        ];

        $emailChanged = $validated['email'] !== $user->email;

        if ($emailChanged) {
            $attributes['email_verified_at'] = null;
        }

        $user->fill($attributes);

        if (filled($validated['password'] ?? null)) {
            $user->password = $validated['password'];
        }

        $user->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return redirect()
            ->route('dashboard.users.index')
            ->with('success', 'Account updated successfully.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        if ($user->posts()->exists() || $user->highlightedPosts()->exists()) {
            return back()->withErrors([
                'user' => 'This account still owns content. Suspend it instead of deleting.',
            ]);
        }

        $user->delete();

        return redirect()
            ->route('dashboard.users.index')
            ->with('success', 'Account deleted.');
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function roleOptions(User $actor): array
    {
        return array_map(
            static fn (UserRole $role): array => ['value' => $role->value, 'label' => $role->label(), 'labelKey' => $role->labelKey()],
            (new UserPolicy)->assignableRoles($actor),
        );
    }

    /**
     * @return list<string>
     */
    private function assignableRoleValues(User $actor): array
    {
        return array_column($this->roleOptions($actor), 'value');
    }
}
