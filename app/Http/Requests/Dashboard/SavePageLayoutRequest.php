<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\SectionType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePageLayoutRequest extends FormRequest
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
            'sections' => ['present', 'array'],
            // Optional optimistic-lock stamp (see BuilderRevision); the web
            // editor omits it, programmatic writers send what they read.
            'expected_revision' => ['nullable', 'string', 'max:64'],
            'sections.*.id' => ['nullable', 'integer', Rule::exists('page_sections', 'id')],
            'sections.*.section_type' => ['required', Rule::in(SectionType::values())],
            'sections.*.zone' => ['nullable', 'string', 'max:40'],
            'sections.*.is_active' => ['required', 'boolean'],
            'sections.*.limit' => ['nullable', 'integer', 'min:1', 'max:12'],
            'sections.*.columns' => ['nullable', 'integer', 'min:1', 'max:6'],
            'sections.*.image_path' => ['nullable', 'string', 'max:2048'],
            'sections.*.cta_url' => ['nullable', 'string', 'max:2048'],
            'sections.*.tone' => ['nullable', Rule::in(['default', 'blue', 'green', 'amber', 'red'])],
            'sections.*.span_lg' => ['nullable', 'integer', 'min:1', 'max:12'],
            'sections.*.span_md' => ['nullable', 'integer', 'min:1', 'max:12'],
            'sections.*.span_sm' => ['nullable', 'integer', 'min:1', 'max:12'],
            'sections.*.config' => ['nullable', 'array'],
            'sections.*.items' => ['nullable', 'array'],
            'sections.*.items.*.id' => ['required', 'integer', 'min:1'],
            'sections.*.items.*.type' => ['nullable', 'string', 'max:40'],
            'sections.*.lists' => ['nullable', 'array'],
            'sections.*.lists.*' => ['nullable', 'array'],
            'sections.*.lists.*.*' => ['array'],
            'sections.*.lists.*.*.*.value' => ['nullable', 'string', 'max:255'],
            'sections.*.lists.*.*.*.title' => ['nullable', 'string', 'max:255'],
            'sections.*.lists.*.*.*.description' => ['nullable', 'string', 'max:2000'],
            'sections.*.lists.*.*.*.icon' => ['nullable', 'string', 'max:60'],
            // Row media/link columns are part of the generic list store; without
            // explicit rules they would rely on the wildcard-array behaviour.
            'sections.*.lists.*.*.*.image_path' => ['nullable', 'string', 'max:2048'],
            'sections.*.lists.*.*.*.url' => ['nullable', 'string', 'max:2048'],
            'sections.*.translations' => ['nullable', 'array'],
            'sections.*.translations.*' => ['array'],
            'sections.*.translations.*.*' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
