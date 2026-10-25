<?php

namespace Tests\Feature\Dashboard;

use App\Enums\JobApplicationStatus;
use App\Enums\UserRole;
use App\Models\Job;
use App\Models\JobApplication;
use App\Models\JobApplicationDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class JobApplicationManagementTest extends TestCase
{
    use RefreshDatabase;

    private function managementUser(): User
    {
        return User::factory()->create(['role' => UserRole::Management->value]);
    }

    private function makeApplication(?Job $job = null): JobApplication
    {
        $application = JobApplication::query()->create([
            'job_id' => ($job ?? Job::factory()->create())->id,
            'first_name' => 'Farid',
            'last_name' => 'Ahmadi',
            'father_name' => 'Nur Ahmad',
            'email' => 'farid.ahmadi@example.com',
            'phone' => '0700111222',
            'experience' => 'Two years as an IT assistant.',
            'status' => JobApplicationStatus::Pending,
        ]);

        return $application;
    }

    public function test_guests_cannot_access_the_applications_list(): void
    {
        $this->get(route('dashboard.jobs.applications.index'))->assertRedirect();
    }

    public function test_family_role_cannot_access_the_applications_list(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Family->value]))
            ->get(route('dashboard.jobs.applications.index'))
            ->assertForbidden();
    }

    public function test_management_sees_the_applications_list(): void
    {
        $this->makeApplication();

        $this->actingAs($this->managementUser())
            ->get(route('dashboard.jobs.applications.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard/jobs/dashboard-job-applications-index')
                ->has('applications.data', 1));
    }

    public function test_applications_can_be_filtered_by_job(): void
    {
        $jobA = Job::factory()->create();
        $jobB = Job::factory()->create();

        $this->makeApplication($jobA);
        $this->makeApplication($jobB);

        $this->actingAs($this->managementUser())
            ->get(route('dashboard.jobs.applications.job', $jobA))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('applications.data', 1)
                ->where('job.id', $jobA->id));
    }

    public function test_opening_a_pending_application_marks_it_read(): void
    {
        $application = $this->makeApplication();

        $this->actingAs($this->managementUser())
            ->get(route('dashboard.applications.show', $application))
            ->assertOk();

        $this->assertSame(JobApplicationStatus::Read, $application->fresh()->status);
    }

    public function test_status_can_be_updated_and_validated(): void
    {
        $application = $this->makeApplication();

        $this->actingAs($this->managementUser())
            ->put(route('dashboard.applications.status.update', $application), ['status' => 'selected'])
            ->assertSessionHasNoErrors();

        $this->assertSame(JobApplicationStatus::Selected, $application->fresh()->status);

        $this->actingAs($this->managementUser())
            ->put(route('dashboard.applications.status.update', $application), ['status' => 'not-a-real-status'])
            ->assertSessionHasErrors('status');
    }

    public function test_management_can_download_a_stored_document(): void
    {
        Storage::fake('local');

        $application = $this->makeApplication();
        Storage::disk('local')->put('job-applications/documents/cv.pdf', 'file contents');

        $document = JobApplicationDocument::query()->create([
            'job_application_id' => $application->id,
            'path' => 'job-applications/documents/cv.pdf',
            'original_name' => 'cv.pdf',
            'mime_type' => 'application/pdf',
            'size' => 13,
        ]);

        $this->actingAs($this->managementUser())
            ->get(route('dashboard.applications.documents.download', $document))
            ->assertOk()
            ->assertDownload('cv.pdf');
    }

    public function test_a_missing_document_file_is_not_found(): void
    {
        Storage::fake('local');

        $application = $this->makeApplication();

        $document = JobApplicationDocument::query()->create([
            'job_application_id' => $application->id,
            'path' => 'job-applications/documents/gone.pdf',
            'original_name' => 'gone.pdf',
            'mime_type' => 'application/pdf',
            'size' => 0,
        ]);

        $this->actingAs($this->managementUser())
            ->get(route('dashboard.applications.documents.download', $document))
            ->assertNotFound();
    }
}
