<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Book;
use App\Models\Event;
use App\Models\Job;
use App\Models\Program;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * The public listing pages paginate on the server and let the frontend
 * infinite-scroll through `next_page_url`, so each response must expose a
 * length-aware paginator (not a plain list).
 */
class PublicListingPaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_articles_listing_is_paginated(): void
    {
        Article::factory()->count(10)->create();

        $this->get('/school/articles')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('school/articles/index')
                ->has('articles.data', 9)
                ->where('articles.current_page', 1)
                ->where('articles.last_page', 2)
                ->has('articles.next_page_url')
            );
    }

    public function test_book_library_is_paginated(): void
    {
        Book::factory()->count(13)->create();

        $this->get('/store')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('school/store/index')
                ->has('books.data', 12)
                ->where('books.current_page', 1)
                ->where('books.last_page', 2)
                ->has('books.next_page_url')
            );
    }

    public function test_programs_listing_is_paginated_with_stable_category_counts(): void
    {
        Program::factory()->count(10)->school()->create();

        $this->get('/school/programs')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('school/programs/index')
                ->has('programs.data', 9)
                ->where('programs.current_page', 1)
                ->where('programs.last_page', 2)
                ->where('programCounts.school', 10)
            );
    }

    public function test_events_listing_is_paginated(): void
    {
        // Anonymous visitors only see published public events.
        Event::factory()->count(13)->create(['audience' => 'public']);

        $this->get('/school/events')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('school/events/index')
                ->has('events.data', 12)
                ->where('events.current_page', 1)
                ->where('events.last_page', 2)
                ->has('events.next_page_url')
            );
    }

    public function test_jobs_listing_is_paginated(): void
    {
        Job::factory()->count(12)->create();

        $this->get('/school/jobs')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('school/jobs/index')
                ->has('jobs.data', 10)
                ->where('jobs.current_page', 1)
                ->where('jobs.last_page', 2)
                ->has('jobs.next_page_url')
            );
    }

    public function test_second_page_only_returns_the_remaining_rows(): void
    {
        Program::factory()->count(10)->school()->create();

        $this->get('/school/programs?page=2')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('programs.data', 1)
                ->where('programs.current_page', 2)
                ->where('programs.next_page_url', null)
            );
    }
}
