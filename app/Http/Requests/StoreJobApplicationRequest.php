<?php

namespace App\Http\Requests;

use App\Models\Job;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobApplicationRequest extends FormRequest
{
    /**
     * Per-document size cap, in kilobytes (3 MB).
     */
    public const MAX_DOCUMENT_KILOBYTES = 3072;

    /**
     * Generous, but not literally unlimited, so a single request can't
     * exhaust disk space or the PHP upload limit.
     */
    public const MAX_DOCUMENTS = 15;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Job $job */
        $job = $this->route('job');

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'father_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('job_applications')->where('job_id', $job->id),
            ],
            'phone' => ['required', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'experience' => ['required', 'string', 'max:5000'],
            'cover_letter' => ['nullable', 'string', 'max:5000'],
            'documents' => ['nullable', 'array', 'max:'.self::MAX_DOCUMENTS],
            'documents.*' => [
                'file',
                'mimes:pdf,doc,docx,jpg,jpeg,png',
                'max:'.self::MAX_DOCUMENT_KILOBYTES,
            ],
        ];
    }
}
