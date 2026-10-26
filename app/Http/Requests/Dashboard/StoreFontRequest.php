<?php

namespace App\Http\Requests\Dashboard;

use App\Support\Rules\FontFile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreFontRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:80'],
            'files' => ['required', 'array'],
            'files.*' => ['nullable', 'file', 'max:5120', new FontFile],
        ];
    }
}
