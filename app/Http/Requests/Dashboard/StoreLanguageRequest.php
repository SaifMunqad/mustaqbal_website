<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreLanguageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:10', 'alpha_dash', 'unique:languages,code'],
            'name' => ['nullable', 'string', 'max:255'],
            'dir' => ['nullable', 'in:ltr,rtl'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
