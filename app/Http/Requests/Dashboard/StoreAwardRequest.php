<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAwardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Spreadsheet values frequently arrive padded with spaces; trim them before
     * validation so the unique-pair check compares the stored value.
     */
    protected function prepareForValidation(): void
    {
        $this->merge(array_map(
            static fn (mixed $value): mixed => is_string($value) ? trim($value) : $value,
            $this->only(['person_id', 'award_id', 'full_name', 'father_name']),
        ) + $this->only(['awarded_at']));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'person_id' => ['required', 'string', 'max:64'],
            'award_id' => [...['required', 'string', 'max:64'], ...$this->pairRules()],
            'full_name' => ['required', 'string', 'max:100'],
            'father_name' => ['nullable', 'string', 'max:100'],
            'awarded_at' => ['required', 'date'],
        ];
    }

    /**
     * The unique (person_id, award_id) pair rule. Subclasses may extend it to
     * ignore the row being updated.
     *
     * @return list<\Illuminate\Validation\Rules\Unique>
     */
    protected function pairRules(): array
    {
        return [
            Rule::unique('awards')->where(fn ($query) => $query
                ->where('person_id', (string) $this->input('person_id'))
                ->where('award_id', (string) $this->input('award_id'))),
        ];
    }
}
