<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\EventAudience;
use App\Models\Event;
use App\Support\Rules\ImageLocation;
use App\Support\Translation\TranslationPayload;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventRequest extends FormRequest
{
    /**
     * Localized fields edited per language.
     *
     * @var list<string>
     */
    private const TRANSLATED = ['title', 'excerpt', 'body', 'location'];

    public function authorize(): bool
    {
        return $this->user()?->can('create', Event::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge([
            'cover_image' => ['nullable', new ImageLocation, 'max:2048'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', new ImageLocation, 'max:2048'],
            'start_at' => ['required', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'audience' => ['required', Rule::in(EventAudience::values())],
            'is_cancelled' => ['nullable', 'boolean'],
            'is_published' => ['nullable', 'boolean'],
        ], TranslationPayload::rules(self::TRANSLATED, [
            'title' => ['string', 'max:255'],
            'excerpt' => ['string', 'max:1000'],
            'body' => ['string'],
            'location' => ['string', 'max:255'],
        ], ['title']));
    }
}
