<?php

namespace App\Http\Requests\Dashboard;

use App\Models\Article;
use App\Support\Rules\ImageLocation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Article::class) ?? false;
    }

    /**
     * Drop empty gallery slots so the stored array only carries real images.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'images' => array_values(array_filter($this->input('images', []), static fn ($image) => filled($image))),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'writer_name' => ['nullable', 'string', 'max:255'],
            'language' => ['nullable', 'string', 'max:10'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'body' => ['required', 'string'],
            'cover_image' => ['nullable', new ImageLocation, 'max:2048'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', new ImageLocation, 'max:2048'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
