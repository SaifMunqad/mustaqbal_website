<?php

namespace App\Http\Requests\Dashboard;

use App\Support\Translation\TranslationPayload;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProgramRequest extends FormRequest
{
    /**
     * Localized fields edited per language.
     *
     * @var list<string>
     */
    private const TRANSLATED = ['name', 'description', 'schedule', 'age_recommendation', 'classroom_number'];

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
            'program_type' => ['required', 'in:school,courses,islamic_madrasa'],
            'fees' => ['required', 'numeric', 'min:0'],
            'available_for_enroll' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ], TranslationPayload::rules(self::TRANSLATED, [
            'name' => ['string', 'max:255'],
            'description' => ['string'],
            'schedule' => ['string', 'max:255'],
            'age_recommendation' => ['string', 'max:255'],
            'classroom_number' => ['string', 'max:100'],
        ], ['name', 'description', 'schedule', 'age_recommendation']));
    }
}
