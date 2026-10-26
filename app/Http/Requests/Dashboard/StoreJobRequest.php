<?php

namespace App\Http\Requests\Dashboard;

use App\Support\Translation\TranslationPayload;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobRequest extends FormRequest
{
    /**
     * Localized fields edited per language.
     *
     * @var list<string>
     */
    private const TRANSLATED = ['title', 'department', 'description', 'requirements'];

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
        return array_merge([
            'category' => ['nullable', Rule::in(['school', 'course', 'islamic_madrasa'])],
            'employment_type' => ['required', Rule::in(['full_time', 'part_time', 'contract'])],
            'working_hours' => ['nullable', 'string', 'max:255'],
            'application_email' => ['nullable', 'email', 'max:255'],
            'application_url' => ['nullable', 'url', 'max:500'],
            'deadline' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ], TranslationPayload::rules(self::TRANSLATED, [
            'title' => ['string', 'max:255'],
            'department' => ['string', 'max:255'],
            'description' => ['string'],
            'requirements' => ['string'],
        ], ['title', 'description']));
    }
}
