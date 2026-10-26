<?php

namespace App\Http\Requests\Dashboard;

use App\Http\Controllers\Dashboard\WhatsAppCampaignController;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreWhatsAppCampaignRequest extends FormRequest
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
            'recipient_source' => ['required', 'in:'.implode(',', WhatsAppCampaignController::SOURCES)],
            'custom_numbers' => ['nullable', 'required_if:recipient_source,custom', 'string', 'max:100000'],
            'mode' => ['required', 'in:text,template'],
            'message' => ['nullable', 'required_if:mode,text', 'string', 'max:100000'],
            'template_name' => ['nullable', 'required_if:mode,template', 'string', 'max:255'],
            'template_language' => ['nullable', 'required_if:mode,template', 'string', 'max:16'],
            'template_variables' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
