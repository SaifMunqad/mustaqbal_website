<?php

namespace Tests\Feature\Dashboard;

use App\Enums\EnrollmentStatus;
use App\Enums\UserRole;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EnrollmentManagementTest extends TestCase
{
    use RefreshDatabase;

    private function managementUser(): User
    {
        return User::factory()->create(['role' => UserRole::Management->value]);
    }

    private function makeEnrollment(): Enrollment
    {
        return Enrollment::query()->create([
            'student_name' => 'Ali Reza',
            'guardian_name' => 'Nur Ahmad',
            'email' => 'guardian@example.com',
            'phone' => '0700123456',
            'grade' => 'Grade 5',
            'date_of_birth' => '2015-01-01',
            'address' => 'Kabul',
        ]);
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('dashboard.enrollments.index'))->assertRedirect(route('login'));
    }

    public function test_family_role_is_forbidden(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Family->value]))
            ->get(route('dashboard.enrollments.index'))
            ->assertForbidden();
    }

    public function test_management_can_see_the_enrollments_list(): void
    {
        $this->makeEnrollment();

        $this->actingAs($this->managementUser())
            ->get(route('dashboard.enrollments.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard/enrollments/dashboard-enrollments-index')
                ->has('enrollments.data', 1));
    }

    public function test_admin_can_see_the_enrollments_list(): void
    {
        $this->makeEnrollment();

        $this->actingAs(User::factory()->create(['role' => UserRole::Admin->value]))
            ->get(route('dashboard.enrollments.index'))
            ->assertOk();
    }

    public function test_opening_a_new_enrollment_marks_it_reviewed(): void
    {
        $enrollment = $this->makeEnrollment();

        $this->actingAs($this->managementUser())
            ->get(route('dashboard.enrollments.show', $enrollment))
            ->assertOk();

        $this->assertSame(EnrollmentStatus::Reviewed, $enrollment->fresh()->status);
    }

    public function test_management_can_reply_and_it_emails_the_guardian(): void
    {
        Mail::fake();

        $enrollment = $this->makeEnrollment();

        $this->actingAs($this->managementUser())
            ->post(route('dashboard.enrollments.replies.store', $enrollment), [
                'subject' => 'Enrollment next steps',
                'body' => '<h2>Welcome</h2><p>Please visit the office.</p>',
            ])
            ->assertSessionHasNoErrors();

        $reply = $this->enrollmentReply($enrollment);

        $this->assertSame('Enrollment next steps', $reply->subject);
        $this->assertStringContainsString('<h2>Welcome</h2>', $reply->body);

        $this->assertSame(EnrollmentStatus::Messaged, $enrollment->fresh()->status);
    }

    public function test_reply_body_is_sanitized(): void
    {
        Mail::fake();

        $enrollment = $this->makeEnrollment();

        $this->actingAs($this->managementUser())
            ->post(route('dashboard.enrollments.replies.store', $enrollment), [
                'subject' => 'Safe',
                'body' => '<p>Visit us</p><script>alert(1)</script>',
            ])
            ->assertSessionHasNoErrors();

        $this->assertStringNotContainsString('<script>', $this->enrollmentReply($enrollment)->body);
    }

    private function enrollmentReply(Enrollment $enrollment): \App\Models\EnrollmentReply
    {
        return $enrollment->replies()->latest('id')->firstOrFail();
    }
}
