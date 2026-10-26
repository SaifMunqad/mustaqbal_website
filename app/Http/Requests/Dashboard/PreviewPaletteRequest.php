<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PreviewPaletteRequest extends FormRequest
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
            'brand_color' => ['nullable', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'accent_color' => ['nullable', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'tint_depth' => ['nullable', Rule::in(['subtle', 'medium', 'bold'])],
        ];
    }
}
