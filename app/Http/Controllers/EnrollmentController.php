<?php

namespace App\Http\Controllers;

use App\Http\Requests\ResendEnrollmentEmailRequest;
use App\Http\Requests\StoreEnrollmentRequest;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class EnrollmentController extends Controller
{
    /**
     * Store a public enrollment enquiry. Submitted through an Inertia form, so a
     * validation failure redirects back with the error bag (surfaced inline) and
     * a success redirects back with a flash notification.
     */
    public function store(StoreEnrollmentRequest $request): RedirectResponse
    {
        Enrollment::query()->create([
            ...$request->validated(),
            'email_verification_token' => Str::random(60),
            'last_email_sent_at' => now(),
        ]);

        return back()->with('success', 'flash.enrollmentSubmitted');
    }

    public function resendEmail(ResendEnrollmentEmailRequest $request): RedirectResponse
    {
        $enrollment = Enrollment::query()
            ->where('email', $request->string('email')->toString())
            ->whereDate('date_of_birth', $request->date('date_of_birth'))
            ->latest()
            ->first();

        if (! $enrollment) {
            return back()->with('error', 'flash.enrollmentResendFailed');
        }

        $enrollment->update([
            'email_verification_token' => Str::random(60),
            'last_email_sent_at' => now(),
        ]);

        return back()->with('success', 'flash.enrollmentResent');
    }
}
