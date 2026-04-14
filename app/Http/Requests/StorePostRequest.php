<?php

namespace App\Http\Requests;

use App\Enums\PostType;
use App\Enums\PostVisibility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $images = $this->input('images', []);

        if (is_array($images)) {
            $this->merge([
                'images' => array_values(array_filter($images, static fn ($image) => filled($image))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(PostType::values())],
            'visibility' => ['nullable', Rule::in(PostVisibility::values())],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', 'url', 'max:2048'],
            'highlighted_student_id' => ['nullable', 'exists:users,id'],
            'scheduled_at' => ['nullable', 'date'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'job_apply_url' => ['nullable', 'url', 'max:2048'],
        ];
    }
}

