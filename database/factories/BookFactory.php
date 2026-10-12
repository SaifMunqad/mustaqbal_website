<?php

namespace Database\Factories;

use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Book>
 */
class BookFactory extends Factory
{
    protected $model = Book::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = Str::title(trim(fake()->words(random_int(2, 5), true)));

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(5)),
            'author' => fake()->name(),
            'published_year' => fake()->numberBetween(1985, 2025),
            'publisher' => fake()->company(),
            'isbn' => '978'.fake()->numerify('##########'),
            'description' => fake()->sentences(3, true),
            'images' => [],
            'file_path' => null,
            'thumbnail_path' => null,
            'book_category_id' => null,
        ];
    }

    /**
     * Attach the book to a category.
     */
    public function forCategory(int $categoryId): static
    {
        return $this->state(fn (array $attributes) => [
            'book_category_id' => $categoryId,
        ]);
    }
}
