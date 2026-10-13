<?php

namespace Tests\Feature;

use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ContactPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_can_view_the_contact_page(): void
    {
        $this->get(route('school.contact'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('school/contact/index')
                ->has('site.contact')
            );
    }

    public function test_visitors_can_submit_the_contact_form(): void
    {
        $this->post(route('community.contact.store'), [
            'name' => 'Amina Rahimi',
            'email' => 'amina@example.com',
            'phone' => '+93 700 123 456',
            'subject' => 'Admissions question',
            'message' => 'When does enrollment open?',
        ])
            ->assertRedirect();

        $this->assertDatabaseHas('messages', [
            'sender_name' => 'Amina Rahimi',
            'sender_email' => 'amina@example.com',
            'subject' => 'Admissions question',
        ]);
    }

    public function test_contact_form_requires_valid_fields(): void
    {
        $this->post(route('community.contact.store'), [
            'name' => '',
            'email' => 'not-an-email',
            'message' => '',
        ])->assertSessionHasErrors(['name', 'email', 'message']);

        $this->assertSame(0, Message::query()->count());
    }
}
