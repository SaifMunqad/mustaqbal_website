<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\EnrollmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StoreEnrollmentReplyRequest;
use App\Http\Requests\Dashboard\UpdateEnrollmentStatusRequest;
use App\Mail\EnrollmentAnswerReply;
use App\Models\Enrollment;
use App\Models\EnrollmentReply;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Stevebauman\Purify\Facades\Purify;

class DashboardEnrollmentController extends Controller
{
    /**
     * Status options shared with the index and show screens.
     *
     * @return list<array{value: string, label: string, labelKey: string}>
     */
    private function statuses(): array
    {
        return array_map(fn (EnrollmentStatus $case): array => [
            'value' => $case->value,
            'label' => $case->label(),
            'labelKey' => $case->labelKey(),
        ], EnrollmentStatus::cases());
    }

    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $statusFilter = in_array($status, EnrollmentStatus::values(), true)
            ? EnrollmentStatus::tryFrom($status)
            : null;

        $enrollments = Enrollment::query()
            ->withCount('replies')
            ->forStatus($statusFilter)
            ->search($request->string('search')->toString())
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Enrollment $enrollment): array => $enrollment->toRow());

        return Inertia::render('dashboard/enrollments/dashboard-enrollments-index', [
            'enrollments' => $enrollments,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $status,
            ],
            'statuses' => $this->statuses(),
        ]);
    }

    public function show(Enrollment $enrollment): Response
    {
        $enrollment->load(['replies' => fn ($query) => $query->latest()->with('author:id,name,role')]);

        // Opening an enquiry for the first time is itself a "reviewed" signal,
        // so a still-new row advances without a separate click.
        if ($enrollment->status === EnrollmentStatus::New) {
            $enrollment->update(['status' => EnrollmentStatus::Reviewed]);
            $enrollment->refresh();
        }

        return Inertia::render('dashboard/enrollments/dashboard-enrollment-show', [
            'enrollment' => [
                ...$enrollment->toRow(),
                'date_of_birth' => $enrollment->date_of_birth?->toDateString(),
                'address' => $enrollment->address,
                'notes' => $enrollment->notes,
                'prefers_email_updates' => $enrollment->prefers_email_updates,
                'replies' => $enrollment->replies->map(fn (EnrollmentReply $reply): array => $reply->toRow()),
            ],
            'statuses' => $this->statuses(),
        ]);
    }

    public function updateStatus(UpdateEnrollmentStatusRequest $request, Enrollment $enrollment): RedirectResponse
    {
        $validated = $request->validated();

        $enrollment->update(['status' => EnrollmentStatus::from($validated['status'])]);

        return back()->with('success', 'flash.enrollmentStatusUpdated');
    }

    /**
     * Record a reply against an enrolment enquiry and email it to the guardian.
     * Sending the reply also moves the enquiry to "messaged" so it is easy to
     * spot which families are still awaiting contact.
     */
    public function storeReply(StoreEnrollmentReplyRequest $request, Enrollment $enrollment): RedirectResponse
    {
        $validated = $request->validated();

        // The body arrives as TipTap HTML; sanitize before storing so what is
        // saved (and later emailed) can never carry unsafe markup.
        $reply = $enrollment->replies()->create([
            'user_id' => $request->user()->id,
            'subject' => $validated['subject'] ?? null,
            'body' => Purify::clean($validated['body']),
            'replied_at' => now(),
        ]);

        // Notify the guardian. Queued so a busy SMTP server never delays the
        // dashboard action.
        if ($enrollment->email) {
            Mail::to($enrollment->email)->queue(new EnrollmentAnswerReply($enrollment, $reply));
        }

        if ($enrollment->status !== EnrollmentStatus::Messaged) {
            $enrollment->update(['status' => EnrollmentStatus::Messaged]);
        }

        return redirect()
            ->route('dashboard.enrollments.show', $enrollment)
            ->with('success', 'flash.enrollmentAnswered');
    }
}
