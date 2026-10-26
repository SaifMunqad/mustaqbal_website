<?php

namespace App\Http\Requests\Dashboard;

use App\Http\Controllers\Dashboard\EmailCampaignController;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmailCampaignRequest extends FormRequest
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
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:100000'],
            'recipient_source' => ['required', 'in:'.implode(',', EmailCampaignController::SOURCES)],
            'custom_emails' => ['nullable', 'required_if:recipient_source,custom', 'string', 'max:100000'],
            'job_filter' => ['nullable', 'integer', Rule::exists('job_postings', 'id')],
        ];
    }
}
