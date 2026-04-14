<?php

namespace App\Http\Controllers;

use App\Http\Requests\ResendEnrollmentEmailRequest;
use App\Http\Requests\StoreEnrollmentRequest;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class EnrollmentController extends Controller
{
    public function store(StoreEnrollmentRequest $request): JsonResponse
    {
        $enrollment = Enrollment::query()->create([
            ...$request->validated(),
            'email_verification_token' => Str::random(60),
            'last_email_sent_at' => now(),
        ]);

        return response()->json([
            'id' => $enrollment->id,
            'message' => 'Enrollment submitted. Verification email has been queued.',
        ], 201);
    }

    public function resendEmail(ResendEnrollmentEmailRequest $request): JsonResponse
    {
        $enrollment = Enrollment::query()
            ->where('email', $request->string('email')->toString())
            ->whereDate('date_of_birth', $request->date('date_of_birth'))
            ->latest()
            ->first();

        abort_if(! $enrollment, 404, 'Enrollment record not found.');

        $enrollment->update([
            'email_verification_token' => Str::random(60),
            'last_email_sent_at' => now(),
        ]);

        return response()->json([
            'message' => 'Verification email was resent successfully.',
        ]);
    }
}

