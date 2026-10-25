<?php

namespace Tests\Feature;

use App\Enums\JobApplicationStatus;
use App\Models\Job;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class JobApplicationTest extends TestCase
{
    use RefreshDatabase;

    private function openJob(): Job
    {
        return Job::factory()->create();
    }

    private function validPayload(): array
    {
        return [
            'first_name' => 'Ahmad',
            'last_name' => 'Karimi',
            'father_name' => 'Haji Karim',
            'email' => 'ahmad.karimi@example.com',
            'phone' => '0700000000',
            'city' => 'Kabul',
            'address' => 'Street 1, Kabul',
            'experience' => 'Three years teaching mathematics at a private school.',
            'cover_letter' => 'I would love to join your team.',
        ];
    }

    public function test_guest_can_open_the_apply_page_for_an_active_job(): void
    {
        $job = $this->openJob();

        $this->get(route('school.jobs.apply', $job->slug))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('school/jobs/school-job-apply')->has('job'));
    }

    public function test_apply_page_is_not_found_for_a_closed_job(): void
    {
        $job = Job::factory()->inactive()->create();

        $this->get(route('school.jobs.apply', $job->slug))->assertNotFound();
    }

    public function test_guest_can_submit_an_application_with_documents(): void
    {
        Storage::fake('local');

        $job = $this->openJob();

        $response = $this->post(route('school.jobs.apply.store', $job->slug), [
            ...$this->validPayload(),
            'documents' => [
                UploadedFile::fake()->create('cv.pdf', 512),
                UploadedFile::fake()->create('degree.jpg', 100, 'image/jpeg'),
            ],
        ]);

        $response->assertRedirect(route('school.jobs'))->assertSessionHas('success');

        $application = JobApplication::query()->firstOrFail();
        $this->assertSame($job->id, $application->job_id);
        $this->assertSame(JobApplicationStatus::Pending, $application->status);
        $this->assertNull($application->user_id);
        $this->assertSame(2, $application->documents()->count());

        $application->documents->each(fn ($document) => Storage::disk('local')->assertExists($document->path));
    }

    public function test_authenticated_applicant_is_linked_to_their_account(): void
    {
        $job = $this->openJob();
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('school.jobs.apply.store', $job->slug), $this->validPayload())
            ->assertSessionHasNoErrors();

        $this->assertSame($user->id, JobApplication::query()->firstOrFail()->user_id);
    }

    public function test_document_larger_than_three_megabytes_is_rejected(): void
    {
        $job = $this->openJob();

        $this->post(route('school.jobs.apply.store', $job->slug), [
            ...$this->validPayload(),
            'documents' => [UploadedFile::fake()->create('huge.pdf', 3073)],
        ])->assertSessionHasErrors('documents.0');

        $this->assertDatabaseCount('job_applications', 0);
    }

    public function test_a_candidate_cannot_apply_twice_for_the_same_job(): void
    {
        $job = $this->openJob();

        $this->post(route('school.jobs.apply.store', $job->slug), $this->validPayload())
            ->assertSessionHasNoErrors();

        $this->post(route('school.jobs.apply.store', $job->slug), $this->validPayload())
            ->assertSessionHasErrors('email');

        $this->assertDatabaseCount('job_applications', 1);
    }

    public function test_application_is_not_accepted_for_a_closed_job(): void
    {
        $job = Job::factory()->inactive()->create();

        $this->post(route('school.jobs.apply.store', $job->slug), $this->validPayload())
            ->assertNotFound();

        $this->assertDatabaseCount('job_applications', 0);
    }

    public function test_required_fields_are_validated(): void
    {
        $job = $this->openJob();

        $this->post(route('school.jobs.apply.store', $job->slug), [])
            ->assertSessionHasErrors([
                'first_name',
                'last_name',
                'father_name',
                'email',
                'phone',
                'experience',
            ]);
    }
}
