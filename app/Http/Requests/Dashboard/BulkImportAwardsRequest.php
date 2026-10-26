<?php

namespace App\Http\Requests\Dashboard;

use App\Http\Controllers\Dashboard\DashboardAwardController;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkImportAwardsRequest extends FormRequest
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
            'rows' => ['required', 'array', 'min:1', 'max:'.DashboardAwardController::MAX_IMPORT_ROWS],
            'rows.*.person_id' => ['required', 'string', 'max:64'],
            'rows.*.award_id' => ['required', 'string', 'max:64'],
            'rows.*.full_name' => ['required', 'string', 'max:100'],
            'rows.*.father_name' => ['nullable', 'string', 'max:100'],
            'rows.*.awarded_at' => ['required', 'date_format:Y-m-d'],
        ];
    }
}
