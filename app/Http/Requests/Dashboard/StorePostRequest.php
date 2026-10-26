<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\PostType;
use App\Models\Post;
use App\Support\Rules\ImageLocation;
use App\Support\Translation\TranslationPayload;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    /**
     * Localized fields edited per language.
     *
     * @var list<string>
     */
    private const TRANSLATED = ['title', 'content'];

    public function authorize(): bool
    {
        return $this->user()?->can('create', [Post::class, (string) $this->input('type')]) ?? false;
    }

    /**
     * Drop empty gallery slots so the stored array only carries real images.
     */
    protected function prepareForValidation(): void
    {
        $images = $this->input('images', []);

        if (is_array($images)) {
            $this->merge([
                'images' => array_values(array_filter($images, static fn ($image) => filled($image))),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge([
            'user_id' => ['required', 'exists:users,id'],
            'type' => ['required', Rule::enum(PostType::class)],
            'visibility' => ['required', 'in:public,community'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', new ImageLocation, 'max:2048'],
            'highlighted_student_id' => ['nullable', 'exists:users,id'],
            'scheduled_at' => ['nullable', 'date'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'job_apply_url' => ['nullable', 'url', 'max:2048'],
            'featured' => ['nullable', 'boolean'],
            'featured_from' => ['nullable', 'date'],
            'featured_until' => ['nullable', 'date', 'after_or_equal:featured_from'],
        ], TranslationPayload::rules(self::TRANSLATED, [
            'title' => ['string', 'max:255'],
            'content' => ['string'],
        ]));
    }
}
