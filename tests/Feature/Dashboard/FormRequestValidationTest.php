<?php

namespace Tests\Feature\Dashboard;

use App\Enums\UserRole;
use App\Models\Article;
use App\Models\Award;
use App\Models\BookCategory;
use App\Models\Contact;
use App\Models\Language;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards the dedicated Form Requests wired into the dashboard controllers.
 *
 * Each test proves a request is actually resolved by its route: a failing
 * request asserts the rule the request enforces rejects bad input, a passing
 * request asserts the same payload is accepted and persisted. Request-level
 * authorization (moved out of the controllers into the requests) is verified
 * by a low-rank actor receiving 403 where an admin succeeds.
 */
class FormRequestValidationTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => UserRole::Admin->value]);
    }

    // ---- Store/UpdateArticleRequest -------------------------------------

    public function test_article_store_requires_title_and_body(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.articles.store'), [])
            ->assertSessionHasErrors(['title', 'body']);

        $this->assertSame(0, Article::query()->count());
    }

    public function test_article_store_persists_a_valid_submission(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.articles.store'), [
                'title' => 'School science fair',
                'body' => '<p>Students showcased projects.</p>',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('dashboard.articles.index'));

        $this->assertDatabaseHas('articles', ['title' => 'School science fair']);
    }

    public function test_article_update_requires_title(): void
    {
        $article = Article::factory()->create();

        $this->actingAs($this->admin())
            ->put(route('dashboard.articles.update', $article), [
                'title' => '',
                'body' => 'Kept body',
            ])
            ->assertSessionHasErrors('title');
    }

    // ---- Store/UpdateAwardRequest + BulkImportAwardsRequest -------------

    public function test_award_store_requires_the_code_and_name_fields(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.awards.store'), [])
            ->assertSessionHasErrors(['person_id', 'award_id', 'full_name', 'awarded_at']);

        $this->assertSame(0, Award::query()->count());
    }

    public function test_award_store_persists_a_valid_submission(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.awards.store'), [
                'person_id' => 'STU-2024-00011',
                'award_id' => 'DIP-2024-000111',
                'full_name' => 'Amina Rahimi',
                'awarded_at' => '2024-05-01',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('dashboard.awards.index'));

        $this->assertDatabaseHas('awards', ['person_id' => 'STU-2024-00011']);
    }

    public function test_award_update_ignores_its_own_unique_pair(): void
    {
        $award = Award::factory()->create([
            'person_id' => 'STU-2024-00022',
            'award_id' => 'CRT-2024-000222',
        ]);

        $this->actingAs($this->admin())
            ->put(route('dashboard.awards.update', $award), [
                'person_id' => 'STU-2024-00022',
                'award_id' => 'CRT-2024-000222',
                'full_name' => 'Renamed Holder',
                'awarded_at' => '2024-06-01',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('Renamed Holder', $award->fresh()->full_name);
    }

    public function test_award_bulk_import_requires_rows(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.awards.bulk'), [])
            ->assertSessionHasErrors('rows');
    }

    // ---- Store/UpdateBookCategoryRequest --------------------------------

    public function test_category_store_requires_a_name(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.categories.store'), [])
            ->assertSessionHasErrors('name');

        $this->assertSame(0, BookCategory::query()->count());
    }

    public function test_category_store_persists_and_update_renames(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.categories.store'), ['name' => 'Mathematics'])
            ->assertSessionHasNoErrors();

        $category = BookCategory::query()->where('name', 'Mathematics')->firstOrFail();

        $this->actingAs($this->admin())
            ->put(route('dashboard.categories.update', $category), ['name' => 'Applied Maths'])
            ->assertSessionHasNoErrors();

        $this->assertSame('Applied Maths', $category->fresh()->name);
    }

    // ---- Store/Update/Reorder LanguageRequest ---------------------------

    public function test_language_store_requires_a_code(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.languages.store'), [])
            ->assertSessionHasErrors('code');
    }

    public function test_language_store_persists_a_curated_code(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.languages.store'), [
                'code' => 'uz',
                'name' => 'Uzbek',
                'dir' => 'ltr',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('languages', ['code' => 'uz']);
    }

    public function test_language_reorder_requires_an_order_array(): void
    {
        $this->actingAs($this->admin())
            ->put(route('dashboard.languages.reorder'), [])
            ->assertSessionHasErrors('order');
    }

    // ---- Store/Update/Answer MessageRequest -----------------------------

    public function test_message_store_requires_its_reference_fields(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.messages.store'), [])
            ->assertSessionHasErrors(['conversation_id', 'user_id', 'body']);
    }

    // ---- Store/UpdateContactRequest (dashboard) -------------------------

    public function test_dashboard_contact_store_requires_valid_fields(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.contacts.store'), [])
            ->assertSessionHasErrors(['name', 'email', 'message']);
    }

    public function test_dashboard_contact_update_persists_resolution(): void
    {
        $contact = Contact::query()->create([
            'name' => 'Sender',
            'email' => 'sender@example.com',
            'message' => 'Hello there',
        ]);

        $this->actingAs($this->admin())
            ->put(route('dashboard.contacts.update', $contact), [
                'name' => 'Sender',
                'email' => 'sender@example.com',
                'message' => 'Hello there',
                'resolved_at' => '2024-07-04',
            ])
            ->assertSessionHasNoErrors();

        $this->assertNotNull($contact->fresh()->resolved_at);
    }

    // ---- Translation controllers: scalar required fields ---------------

    public function test_event_store_requires_schedule_and_audience(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.events.store'), [])
            ->assertSessionHasErrors(['start_at', 'audience']);
    }

    public function test_job_store_requires_employment_type(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.jobs.store'), [])
            ->assertSessionHasErrors('employment_type');
    }

    public function test_program_store_requires_type_and_fees(): void
    {
        $this->actingAs($this->admin())
            ->post(route('dashboard.programs.store'), [])
            ->assertSessionHasErrors(['program_type', 'fees']);
    }

    // ---- Store/Book PDF UploadRequest (JSON endpoints) ------------------

    public function test_image_upload_requires_a_file(): void
    {
        $this->actingAs($this->admin())
            ->postJson(route('dashboard.upload'), [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('image');
    }

    public function test_pdf_upload_requires_a_file(): void
    {
        $this->actingAs($this->admin())
            ->postJson(route('dashboard.upload-pdf'), [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }

    // ---- Request-level authorization (StoreUserRequest/UpdateUserRequest)

    public function test_a_teacher_cannot_create_users_via_request_authorization(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Teacher->value]))
            ->post(route('dashboard.users.store'), [
                'name' => 'Blocked',
                'email' => 'blocked@example.com',
                'role' => UserRole::Teacher->value,
                'status' => 'active',
            ])
            ->assertForbidden();

        $this->assertSame(0, User::query()->where('email', 'blocked@example.com')->count());
    }

    public function test_a_teacher_cannot_update_an_admin_via_request_authorization(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin->value]);

        $this->actingAs(User::factory()->create(['role' => UserRole::Teacher->value]))
            ->patch(route('dashboard.users.update', $admin), [
                'name' => 'Hacked',
                'email' => $admin->email,
                'role' => UserRole::Teacher->value,
                'status' => 'active',
            ])
            ->assertForbidden();
    }
}
