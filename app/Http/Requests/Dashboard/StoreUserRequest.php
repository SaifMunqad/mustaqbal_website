<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', User::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique(User::class)],
            'role' => ['required', 'string', Rule::in($this->assignableRoleValues())],
            'status' => ['nullable', 'string', Rule::in(UserStatus::values())],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ];
    }

    /**
     * Role values the acting user is allowed to grant, per the user policy.
     *
     * @return list<string>
     */
    private function assignableRoleValues(): array
    {
        return array_map(
            static fn (UserRole $role): string => $role->value,
            (new UserPolicy)->assignableRoles($this->user()),
        );
    }
}
